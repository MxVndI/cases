from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from routes.deps import require_admin, require_superadmin
from services.payment import PaymentService
from services.user import UserService


class UpdateRoleRequest(BaseModel):
    role: str


class GrantBalanceRequest(BaseModel):
    amount: float

router = APIRouter(prefix="/users", route_class=DishkaRoute, tags=["Users"])


@router.get("/", summary="Список пользователей")
async def list_users(
    us: FromDishka[UserService],
    _: str = Depends(require_admin),
    search: str | None = Query(None),
    status: str | None = Query(None),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Получить список пользователей с фильтрами"""
    result = await us.get_users(search=search, status=status, role=role, page=page, limit=limit)
    if result is None:
        raise HTTPException(500, detail="User service error")
    return result


@router.post("/", summary="Создать пользователя")
async def create_user(
    email: str,
    us: FromDishka[UserService],
    _: str = Depends(require_admin),
):
    """Создать нового пользователя через вызов user API"""
    try:
        result = await us.create_user(email)
        if not result:
            raise HTTPException(400, detail="Failed to create user")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/{user_id}/block", summary="Заблокировать пользователя")
async def block_user(
    user_id: str,
    us: FromDishka[UserService],
    _: str = Depends(require_admin),
):
    """Заблокировать пользователя"""
    result = await us.block_user(user_id)
    if result is None:
        raise HTTPException(404, detail="User not found")
    return result


@router.post("/{user_id}/unblock", summary="Разблокировать пользователя")
async def unblock_user(
    user_id: str,
    us: FromDishka[UserService],
    _: str = Depends(require_admin),
):
    """Разблокировать пользователя"""
    result = await us.unblock_user(user_id)
    if result is None:
        raise HTTPException(404, detail="User not found")
    return result


@router.patch("/{user_id}/role", summary="Изменить роль пользователя")
async def update_user_role(
    user_id: str,
    body: UpdateRoleRequest,
    us: FromDishka[UserService],
    _: str = Depends(require_superadmin),
):
    """Изменить роль пользователя (только superadmin)"""
    result = await us.update_role(user_id, body.role)
    if result is None:
        raise HTTPException(404, detail="User not found")
    return result


@router.post("/{user_id}/grant-balance", summary="Выдать баланс пользователю")
async def grant_balance(
    user_id: str,
    body: GrantBalanceRequest,
    ps: FromDishka[PaymentService],
    _: str = Depends(require_admin),
):
    """Выдать баланс пользователю (только admin/superadmin)"""
    if body.amount <= 0:
        raise HTTPException(400, detail="Amount must be positive")
    result = await ps.grant_balance(user_id, body.amount)
    if result is None:
        raise HTTPException(500, detail="Failed to grant balance")
    return result
