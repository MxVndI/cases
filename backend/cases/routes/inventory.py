from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie
from fastapi.exceptions import HTTPException
from services.auth import AuthService
from services.inventory import InventoryService
from services.item import ItemService
from services.payment import PaymentService
from services.user import UserService

router = APIRouter(prefix="/inventory", route_class=DishkaRoute)

SYSTEM_UUID = UUID(int=0)


@router.get("/")
async def get_inventory(
    sid: Annotated[str | None, Cookie()],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
):
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)
    inventory = await inv_s.get_by_user_id(user_id)
    if not inventory:
        return {"items": []}
    return inventory


@router.get("/user/{user_id}")
async def get_user_inventory(
    user_id: UUID,
    inv_s: FromDishka[InventoryService],
):
    inventory = await inv_s.get_by_user_id(user_id)
    if not inventory:
        return {"items": []}
    return inventory


@router.post("/sell/{entry_id}")
async def sell_item(
    entry_id: UUID,
    sid: Annotated[str | None, Cookie()],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
    item_s: FromDishka[ItemService],
    pay_s: FromDishka[PaymentService],
    user_service: FromDishka[UserService],
):
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data and user_data.get("status") == "blocked":
        raise HTTPException(403, detail="blocked")

    # Remove from inventory by unique entry id
    removed = await inv_s.remove_item(user_id, entry_id)
    if not removed:
        raise HTTPException(404, detail="Предмет не найден в инвентаре")

    # Get item price from catalog
    try:
        item = await item_s.get_by_id(removed.item_id)
    except ValueError:
        raise HTTPException(404, detail="Предмет не найден")

    # Credit user: system → user
    ok = await pay_s.create_transaction(
        from_id=SYSTEM_UUID, to_id=user_id, amount=item.price,
        description=f"Продажа: {item.name}",
    )
    if not ok:
        # Rollback: re-add item to inventory
        await inv_s.add_item(user_id, removed.item_id)
        raise HTTPException(500, detail="Ошибка оплаты")

    return {"sold_price": item.price, "item_id": str(removed.item_id)}


@router.post("/sell-all")
async def sell_all(
    sid: Annotated[str | None, Cookie()],
    auth: FromDishka[AuthService],
    inv_s: FromDishka[InventoryService],
    item_s: FromDishka[ItemService],
    pay_s: FromDishka[PaymentService],
    user_service: FromDishka[UserService],
):
    uid = await auth.get_uid(sid)
    if not uid:
        raise HTTPException(401, detail="Не авторизован")
    user_id = UUID(uid.get("uid")) if isinstance(uid, dict) else UUID(uid)

    user_data = await user_service.get_user_by_id(str(user_id))
    if user_data and user_data.get("status") == "blocked":
        raise HTTPException(403, detail="blocked")

    removed = await inv_s.remove_all(user_id)
    if not removed:
        return {"sold_count": 0, "total_price": 0}

    total_price = 0.0
    sold_count = 0
    for entry in removed:
        try:
            item = await item_s.get_by_id(entry.item_id)
        except ValueError:
            continue
        ok = await pay_s.create_transaction(
            from_id=SYSTEM_UUID, to_id=user_id, amount=item.price,
            description=f"Продажа: {item.name}",
        )
        if ok:
            total_price += item.price
            sold_count += 1

    return {"sold_count": sold_count, "total_price": total_price}
