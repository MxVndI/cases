from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka, inject
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, EmailStr
from services.session import SessionService
from services.user import UserService

router = APIRouter(prefix="/users", route_class=DishkaRoute)


class Cookies(BaseModel):
    sid: str
    model_config = ConfigDict(extra="ignore")


class CreateUserRequest(BaseModel):
    email: EmailStr
    nickname: str | None = None


class CreateUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    nickname: str
    role: str
    status: str


class PublicUserResponse(BaseModel):
    id: UUID
    nickname: str
    role: str
    status: str


class UpdateStatusRequest(BaseModel):
    status: str


class UpdateMeRequest(BaseModel):
    nickname: str | None = None


def _verify_service_token(authorization: str | None) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization.replace("Bearer ", "")
    from settings import settings
    if token not in settings.allowed_tokens:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


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
        return user.model_dump(by_alias=False)
    raise HTTPException(status_code=404)


@router.patch("/me")
async def update_me(
    body: UpdateMeRequest,
    us: FromDishka[UserService],
    uid=Depends(get_current_user_id),
):
    user = await us.update_user(uid, nickname=body.nickname)
    if not user:
        raise HTTPException(status_code=404)
    return user.model_dump(by_alias=False)


@router.get("/", response_model=dict)
async def list_users(
    us: FromDishka[UserService],
    authorization: Annotated[str | None, Header()] = None,
    search: str | None = Query(None),
    user_status: str | None = Query(None, alias="status"),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List users with filters (inter-service call with token auth)"""
    _verify_service_token(authorization)
    users, total = await us.get_users(
        search=search, status=user_status, role=role, page=page, limit=limit
    )
    return {
        "users": [
            CreateUserResponse(
                id=u.id, email=u.email, nickname=u.nickname, role=u.role, status=u.status
            )
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/public/{nickname}", response_model=PublicUserResponse)
async def get_public_user_by_nickname(
    nickname: str,
    us: FromDishka[UserService],
):
    user = await us.get_user_by_nickname(nickname)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return PublicUserResponse(
        id=user.id,
        nickname=user.nickname,
        role=user.role,
        status=user.status,
    )


@router.get("/{user_id}", response_model=CreateUserResponse)
async def get_user_by_id(
    user_id: str,
    us: FromDishka[UserService],
    authorization: Annotated[str | None, Header()] = None,
):
    """Get user by ID (inter-service call with token auth)"""
    _verify_service_token(authorization)
    user = await us.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404)
    return CreateUserResponse(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        role=user.role,
        status=user.status,
    )


@router.patch("/{user_id}/status", response_model=CreateUserResponse)
async def update_user_status(
    user_id: str,
    body: UpdateStatusRequest,
    us: FromDishka[UserService],
    authorization: Annotated[str | None, Header()] = None,
):
    """Update user status (block/unblock) — inter-service call with token auth"""
    _verify_service_token(authorization)
    user = await us.update_status(user_id, body.status)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return CreateUserResponse(
        id=user.id, email=user.email, nickname=user.nickname,
        role=user.role, status=user.status,
    )


@router.post("/", response_model=CreateUserResponse)
async def create_user(
    request: CreateUserRequest,
    us: FromDishka[UserService],
    authorization: Annotated[str | None, Header()] = None,
):
    """Создать пользователя (вызывается от admin сервиса)"""
    _verify_service_token(authorization)

    # Проверяем, существует ли уже пользователь
    existing_user = await us.get_user_by_email(request.email)
    if existing_user:
        return CreateUserResponse(
            id=existing_user.id,
            email=existing_user.email,
            nickname=existing_user.nickname,
            role=existing_user.role,
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
        role=new_user.role,
        status=new_user.status,
    )
