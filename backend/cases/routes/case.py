import json
from contextlib import suppress
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie, Header, Query
from fastapi.exceptions import HTTPException
from fastapi.responses import StreamingResponse
from models.item import Item
from models.win_history import WinHistory
from redis.asyncio import Redis
from schemas.requests import CalculateChancesRequest, CalculatePriceRequest, CreateCase, UpdateCase
from schemas.responses import CaseResponse, OpenCaseResponse
from services.auth import AuthService
from services.case import CaseService
from services.inventory import InventoryService
from services.item import ItemService
from services.local_auth import LocalAuth
from services.user import UserService

router = APIRouter(route_class=DishkaRoute)


async def _can_access_disabled_cases(
    sid: str | None,
    authorization: str | None,
    la: LocalAuth,
    auth: AuthService,
    user_service: UserService,
) -> bool:
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and la.verify_token(token.strip()):
            return True

    if not sid:
        return False

    uid = await auth.get_uid(sid)
    if not uid:
        return False

    user_id = str(uid.get("uid")) if isinstance(uid, dict) else str(uid)
    user_data = await user_service.get_user_by_id(user_id)
    return bool(user_data and user_data.get("role") == "admin")


@router.get("/wins/stream")
async def wins_stream(redis: FromDishka[Redis]):
    pubsub = redis.pubsub()
    await pubsub.subscribe("wins_channel")

    async def event_generator():
        try:
            yield ": connected\n\n"
            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=15.0,
                )
                if message and message.get("data"):
                    yield f"data: {message['data']}\n\n"
                else:
                    yield ": keepalive\n\n"
        finally:
            with suppress(Exception):
                await pubsub.unsubscribe("wins_channel")
            with suppress(Exception):
                await pubsub.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/recent_wins")
async def recent_wins(
    redis: FromDishka[Redis],
    item_service: FromDishka[ItemService],
    user_service: FromDishka[UserService],
    limit: int = Query(default=20, ge=1, le=50),
):
    raw = await redis.lrange("recent_wins", 0, limit - 1)
    wins = [json.loads(entry) for entry in raw]

    for win in wins:
        if not win.get("item_img_url"):
            item_id = win.get("item_id")
            if item_id:
                try:
                    item = await item_service.get_by_id(UUID(item_id))
                    win["item_img_url"] = item.img_url
                except Exception:
                    pass

            if not win.get("item_img_url"):
                item_name = win.get("item_name")
                if item_name:
                    item = await Item.find_one(Item.name == item_name)
                    if item:
                        win["item_img_url"] = item.img_url

        if not win.get("user_nickname"):
            user_id = win.get("user_id")
            if user_id:
                user = await user_service.get_user_by_id(user_id)
                if user:
                    win["user_nickname"] = user.get("nickname")

    return wins


@router.get("/wins/my")
async def my_wins(
    auth: FromDishka[AuthService],
    sid: Annotated[str | None, Cookie()] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    if not sid:
        raise HTTPException(401, detail="Не авторизован")
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    wins = (
        await WinHistory.find(WinHistory.user_id == user_id)
        .sort(-WinHistory.timestamp)
        .skip(offset)
        .limit(limit)
        .to_list()
    )
    return [w.model_dump() for w in wins]


@router.get("/wins/my/stats")
async def my_wins_stats(
    auth: FromDishka[AuthService],
    sid: Annotated[str | None, Cookie()] = None,
):
    if not sid:
        raise HTTPException(401, detail="Не авторизован")
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    total = await WinHistory.find(WinHistory.user_id == user_id).count()
    recent = (
        await WinHistory.find(WinHistory.user_id == user_id)
        .sort(-WinHistory.timestamp)
        .limit(3)
        .to_list()
    )
    return {
        "total_opened": total,
        "recent_wins": [w.model_dump() for w in recent],
    }


@router.get("/wins/user/{user_id}")
async def user_wins(
    user_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    wins = (
        await WinHistory.find(WinHistory.user_id == user_id)
        .sort(-WinHistory.timestamp)
        .skip(offset)
        .limit(limit)
        .to_list()
    )
    return [w.model_dump() for w in wins]


@router.get("/wins/user/{user_id}/stats")
async def user_wins_stats(user_id: UUID):
    total = await WinHistory.find(WinHistory.user_id == user_id).count()
    recent = (
        await WinHistory.find(WinHistory.user_id == user_id)
        .sort(-WinHistory.timestamp)
        .limit(3)
        .to_list()
    )
    return {
        "total_opened": total,
        "recent_wins": [w.model_dump() for w in recent],
    }


@router.post("/calculate_chances")
async def calculate_chances(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], data: CalculateChancesRequest
):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    try:
        return await cs.calculate_chances(data.item_ids)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))


@router.post("/calculate_price")
async def calculate_price(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], data: CalculatePriceRequest
):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    try:
        items = [{"item_id": i.item_id, "drop_chance": i.drop_chance} for i in data.items]
        return await cs.calculate_price(items, data.margin)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))


@router.get("/")
async def get_all(
    cs: FromDishka[CaseService],
    la: FromDishka[LocalAuth],
    auth: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> list[CaseResponse]:

    try:
        include_disabled = await _can_access_disabled_cases(sid, authorization, la, auth, user_service)
        return await cs.get(include_disabled=include_disabled)
    except:
        raise HTTPException(404)


@router.get("/by-name/{name}")
async def get_by_name(
    name: str,
    cs: FromDishka[CaseService],
    la: FromDishka[LocalAuth],
    auth: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> CaseResponse | None:

    include_disabled = await _can_access_disabled_cases(sid, authorization, la, auth, user_service)
    case = await cs.get_by_name(name, include_disabled=include_disabled)
    if not case:
        raise HTTPException(404)
    return case


@router.get("/by-system-name/{system_name}")
async def get_by_system_name(
    system_name: str,
    cs: FromDishka[CaseService],
    la: FromDishka[LocalAuth],
    auth: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> CaseResponse | None:
    include_disabled = await _can_access_disabled_cases(sid, authorization, la, auth, user_service)
    case = await cs.get_by_system_name(system_name, include_disabled=include_disabled)
    if not case:
        raise HTTPException(404)
    return case


@router.get("/{id}")
async def get_by_id(
    id: UUID,
    cs: FromDishka[CaseService],
    la: FromDishka[LocalAuth],
    auth: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> CaseResponse | None:

    try:
        include_disabled = await _can_access_disabled_cases(sid, authorization, la, auth, user_service)
        case = await cs.get_by_id(id, include_disabled=include_disabled)
        if not case:
            raise HTTPException(404)
        return case
    except:
        raise HTTPException(404)


@router.post("/")
async def create(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], cd: CreateCase
) -> UUID:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.create(cd)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))


@router.patch("/")
async def update(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], cd: UpdateCase
) -> UUID | None:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.update(cd)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))


@router.delete("/{id}")
async def delete(
    id: UUID, token: str, cs: FromDishka[CaseService], la: FromDishka[LocalAuth]
):
    if not la.verify_token(token):
        raise HTTPException(403)
    return await cs.delete(id)


@router.post("/open/by-name/{name}")
async def open_case_by_name(
    name: str,
    sid: Annotated[str | None, Cookie()],
    cs: FromDishka[CaseService],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
    user_service: FromDishka[UserService],
) -> OpenCaseResponse:
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")

    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_nickname = None
    allow_disabled = False
    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data:
        if user_data.get("status") == "blocked":
            raise HTTPException(403, detail="blocked")
        user_nickname = user_data.get("nickname")
        allow_disabled = user_data.get("role") == "admin"

    try:
        won_item = await cs.open_by_name(name, user_id, user_nickname=user_nickname, allow_disabled=allow_disabled)
    except ValueError as e:
        detail = str(e)
        if "Insufficient funds" in detail:
            raise HTTPException(402, detail=detail)
        raise HTTPException(400, detail=detail)

    if not won_item:
        raise HTTPException(404, detail="Кейс не найден или пуст")

    inventory = await inv_s.get_by_user_id(user_id)

    return OpenCaseResponse(won_item=won_item, inventory=inventory)


@router.post("/open/by-system-name/{system_name}")
async def open_case_by_system_name(
    system_name: str,
    sid: Annotated[str | None, Cookie()],
    cs: FromDishka[CaseService],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
    user_service: FromDishka[UserService],
) -> OpenCaseResponse:
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")

    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_nickname = None
    allow_disabled = False
    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data:
        if user_data.get("status") == "blocked":
            raise HTTPException(403, detail="blocked")
        user_nickname = user_data.get("nickname")
        allow_disabled = user_data.get("role") == "admin"

    try:
        won_item = await cs.open_by_system_name(system_name, user_id, user_nickname=user_nickname, allow_disabled=allow_disabled)
    except ValueError as e:
        detail = str(e)
        if "Insufficient funds" in detail:
            raise HTTPException(402, detail=detail)
        raise HTTPException(400, detail=detail)

    if not won_item:
        raise HTTPException(404, detail="Кейс не найден или пуст")

    inventory = await inv_s.get_by_user_id(user_id)

    return OpenCaseResponse(won_item=won_item, inventory=inventory)


@router.post("/open/{id}")
async def open_case(
    id: UUID,
    sid: Annotated[str | None, Cookie()],
    cs: FromDishka[CaseService],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
    user_service: FromDishka[UserService],
) -> OpenCaseResponse:
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")

    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_nickname = None
    allow_disabled = False
    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data:
        if user_data.get("status") == "blocked":
            raise HTTPException(403, detail="blocked")
        user_nickname = user_data.get("nickname")
        allow_disabled = user_data.get("role") == "admin"

    try:
        won_item = await cs.open(id, user_id, user_nickname=user_nickname, allow_disabled=allow_disabled)
    except ValueError as e:
        detail = str(e)
        if "Insufficient funds" in detail:
            raise HTTPException(402, detail=detail)
        raise HTTPException(400, detail=detail)

    if not won_item:
        raise HTTPException(404, detail="Кейс не найден или пуст")

    inventory = await inv_s.get_by_user_id(user_id)

    return OpenCaseResponse(won_item=won_item, inventory=inventory)
