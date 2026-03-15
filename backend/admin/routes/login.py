from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException
from schemas.requests import AdminLogin
from schemas.responses import AdminAuthResponse
from services.local_auth import LocalAuth

router = APIRouter(prefix="/auth", route_class=DishkaRoute, tags=["Auth"])


@router.post(
    "/login", response_model=AdminAuthResponse, summary="Аутентификация администратора"
)
async def login(data: AdminLogin, auth: FromDishka[LocalAuth]):
    """Аутентификация администратора по логину и паролю"""
    try:
        token = auth.verify_user(data.login, data.password)
        if not token:
            raise HTTPException(401, detail="Неверный логин или пароль")
        return AdminAuthResponse(access_token=token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
