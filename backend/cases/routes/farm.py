import json
import time
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from redis.asyncio import Redis
from services.auth import AuthService
from services.payment import PaymentService
from services.user import UserService

router = APIRouter(route_class=DishkaRoute)

# --- Config ---
OFFLINE_FARM_CAP = 1000
AUTO_CLICK_INTERVALS = [1000, 750, 500, 333, 250]
SYSTEM_UUID = UUID(int=0)


class FarmSyncRequest(BaseModel):
    auto_clicker_level: int = 0
    auto_clicker_speed_level: int = 0


class FarmSyncResponse(BaseModel):
    pending: int
    auto_clicker_level: int
    auto_clicker_speed_level: int
    offline_earned: int


class FarmClaimResponse(BaseModel):
    claimed: int
    success: bool


def _redis_key(user_id: UUID) -> str:
    return f"farm:{user_id}"


def _compute_offline(
    auto_clicker_level: int,
    auto_clicker_speed_level: int,
    last_sync: float,
    current_pending: float,
) -> float:
    if auto_clicker_level <= 0:
        return 0.0
    now = time.time()
    elapsed = max(0.0, now - last_sync)
    interval_ms = AUTO_CLICK_INTERVALS[
        min(auto_clicker_speed_level, len(AUTO_CLICK_INTERVALS) - 1)
    ]
    rate_per_sec = auto_clicker_level * (1000.0 / interval_ms)
    earned = elapsed * rate_per_sec
    # Cap total pending at OFFLINE_FARM_CAP
    headroom = max(0.0, OFFLINE_FARM_CAP - current_pending)
    return int(min(earned, headroom))


@router.post("/farm/sync")
async def farm_sync(
    body: FarmSyncRequest,
    redis: FromDishka[Redis],
    auth: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
) -> FarmSyncResponse:
    if not sid:
        raise HTTPException(401, detail="Не авторизован")
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data and user_data.get("status") == "blocked":
        raise HTTPException(403, detail="blocked")

    key = _redis_key(user_id)
    raw = await redis.get(key)

    now = time.time()
    if raw:
        state = json.loads(raw)
        old_pending = state.get("pending", 0.0)
        old_level = state.get("auto_clicker_level", 0)
        old_speed = state.get("auto_clicker_speed_level", 0)
        last_sync = state.get("last_sync", now)

        # Compute offline earnings with OLD levels (what was running while offline)
        offline = _compute_offline(old_level, old_speed, last_sync, old_pending)
        new_pending = int(min(old_pending + offline, OFFLINE_FARM_CAP))
    else:
        new_pending = 0
        offline = 0

    # Save updated state with new levels from client
    new_state = {
        "auto_clicker_level": body.auto_clicker_level,
        "auto_clicker_speed_level": body.auto_clicker_speed_level,
        "last_sync": now,
        "pending": int(new_pending),
    }
    await redis.set(key, json.dumps(new_state))

    return FarmSyncResponse(
        pending=new_pending,
        auto_clicker_level=body.auto_clicker_level,
        auto_clicker_speed_level=body.auto_clicker_speed_level,
        offline_earned=offline,
    )


@router.post("/farm/claim")
async def farm_claim(
    redis: FromDishka[Redis],
    auth: FromDishka[AuthService],
    payment: FromDishka[PaymentService],
    user_service: FromDishka[UserService],
    sid: Annotated[str | None, Cookie()] = None,
) -> FarmClaimResponse:
    if not sid:
        raise HTTPException(401, detail="Не авторизован")
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data and user_data.get("status") == "blocked":
        raise HTTPException(403, detail="blocked")

    key = _redis_key(user_id)
    raw = await redis.get(key)

    if not raw:
        return FarmClaimResponse(claimed=0, success=True)

    state = json.loads(raw)
    old_level = state.get("auto_clicker_level", 0)
    old_speed = state.get("auto_clicker_speed_level", 0)
    last_sync = state.get("last_sync", time.time())
    old_pending = state.get("pending", 0)

    # Add any offline earnings since last sync
    offline = _compute_offline(old_level, old_speed, last_sync, old_pending)
    total = int(min(old_pending + offline, OFFLINE_FARM_CAP))

    if total <= 0:
        return FarmClaimResponse(claimed=0, success=True)

    amount = total

    # Credit via payment service (system → user)
    ok = await payment.create_transaction(
        SYSTEM_UUID, user_id, float(amount),
        description="Фарм: авто-кликер",
    )
    if not ok:
        raise HTTPException(500, detail="Ошибка зачисления")

    # Reset pending, update timestamp
    now = time.time()
    state["pending"] = 0
    state["last_sync"] = now
    await redis.set(key, json.dumps(state))

    return FarmClaimResponse(claimed=amount, success=True)
