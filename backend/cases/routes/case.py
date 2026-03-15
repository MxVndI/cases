from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie
from fastapi.exceptions import HTTPException
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse, OpenCaseResponse
from services.auth import AuthService
from services.case import CaseService
from services.inventory import InventoryService
from services.local_auth import LocalAuth

router = APIRouter(prefix="/cases", route_class=DishkaRoute)


@router.get("/")
async def get_all(cs: FromDishka[CaseService]) -> list[CaseResponse]:

    try:
        return await cs.get()
    except:
        raise HTTPException(404)


@router.get("/{id}")
async def get_by_id(id: UUID, cs: FromDishka[CaseService]) -> CaseResponse | None:

    try:
        return await cs.get_by_id(id)
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
        raise HTTPException(404, detail=str(e))


@router.patch("/")
async def update(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], cd: UpdateCase
) -> UUID | None:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.update(cd)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.delete("/{id}")
async def delete(
    id: UUID, token: str, cs: FromDishka[CaseService], la: FromDishka[LocalAuth]
):
    if not la.verify_token(token):
        raise HTTPException(403)
    return await cs.delete(id)


@router.post("/open/{id}")
async def open_case(
    id: UUID,
    sid: Annotated[str | None, Cookie()],
    cs: FromDishka[CaseService],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
) -> OpenCaseResponse:
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")

    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    won_item = await cs.open(id, user_id)
    if not won_item:
        raise HTTPException(404, detail="Кейс не найден или пуст")

    inventory = await inv_s.get_by_user_id(user_id)

    return OpenCaseResponse(won_item=won_item, inventory=inventory)
