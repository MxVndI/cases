from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException
from schemas.requests import AdminLogin
from schemas.responses import AdminAuthResponse
from services.local_auth import LocalAuth
from services.user import UserService

router = APIRouter(prefix="/users", route_class=DishkaRoute, tags=["Users"])


@router.post("/", summary="Создать пользователя")
async def create_user(
    email: str,
    us: FromDishka[UserService],
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
