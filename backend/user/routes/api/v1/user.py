from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka, inject
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from services.session import SessionService
from services.user import UserService

router = APIRouter(prefix="/users", route_class=DishkaRoute)


class Cookies(BaseModel):
    sid: str
    model_config = ConfigDict(extra="ignore")


class CreateUserRequest(BaseModel):
    email: EmailStr


class CreateUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    nickname: str
    status: str


@inject
async def get_current_user_id(
    cookies: Annotated[Cookies, Cookie()],
    sd: FromDishka[SessionService],
) -> str:
    user_id = await sd.get_user_id_by_sid(cookies.sid)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )
    return str(user_id)


@router.get("/me")
async def get_user(
    us: FromDishka[UserService],
    uid=Depends(get_current_user_id),
):
    user = await us.get_user_by_id(uid)
    if user:
        return user
    raise HTTPException(status_code=404)


@router.post("/", response_model=CreateUserResponse)
async def create_user(
    request: CreateUserRequest,
    us: FromDishka[UserService],
    authorization: Annotated[str | None, Header()] = None,
):
    """Создать пользователя (вызывается от admin сервиса)"""
    # Проверка токена авторизации
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")

    # Получаем настройки для проверки токена
    from settings import settings

    if token not in settings.allowed_tokens:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token",
        )

    # Проверяем, существует ли уже пользователь
    existing_user = await us.get_user_by_email(request.email)
    if existing_user:
        return CreateUserResponse(
            id=existing_user.id,
            email=existing_user.email,
            nickname=existing_user.nickname,
            status=existing_user.status,
        )

    # Создаем нового пользователя
    from models.user import User

    new_user = User(email=request.email)
    await new_user.save()

    return CreateUserResponse(
        id=new_user.id,
        email=new_user.email,
        nickname=new_user.nickname,
        status=new_user.status,
    )
