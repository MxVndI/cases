from typing import Literal, Annotated
from fastapi import APIRouter, Request, Cookie, HTTPException

from dishka.integrations.fastapi import FromDishka, DishkaRoute
from services import AuthService, SessionService
from schemas.api import (
    Cookie as CookieSchema,
    LoginFInishRequest,
    LoginInitRequest,
    AuthResponse,
)


router = APIRouter(route_class=DishkaRoute)

ProviderType = Literal[
    "yandex",
    "discord",
]


@router.get("/me", response_model=AuthResponse)
async def me(
    cookie: Annotated[CookieSchema, Cookie()],
    auth_service: FromDishka[AuthService],
    session_service: FromDishka[SessionService],
):
    if not cookie.sid:
        raise HTTPException(status_code=401)
    sid = cookie.sid
    sid = auth_service.verify_session(sid)
    if data := await session_service.get_session_user(sid):
        return {"authenticated": True, "user": data}
    raise HTTPException(status_code=404)


@router.get("/{provider}/login")
async def login_oauth(provider: ProviderType, auth_service: FromDishka[AuthService]):

    async with auth_service.get_sso(provider) as sso:
        return await sso.get_login_redirect()


@router.get("/auth/{provider}/callback")
async def auth_callback(
    provider: ProviderType, request: Request, auth_service: FromDishka[AuthService]
):
    return await auth_service.verify_user_oauth(provider, request)


@router.post("/email/login/start")
async def login_email(
    req_body: LoginInitRequest, auth_service: FromDishka[AuthService]
):
    return await auth_service.init_verify_user_email(req_body.email)


@router.post("/email/login/finish")
async def enter_email_code(
    req_body: LoginFInishRequest,
    cookie: Annotated[CookieSchema, Cookie()],
    auth_service: FromDishka[AuthService],
):

    return await auth_service.finish_verify_user_email(
        cookie.email, cookie.cvid, req_body.code
    )
