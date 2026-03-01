from fastapi import APIRouter, HTTPException, Cookie, Depends, status
from dishka.integrations.fastapi import FromDishka, DishkaRoute, inject

# from schemas.v1.user import CreateUser, EmailRequest, SimpleUpdateRequest

from services.user import UserService
from services.session import SessionService

from typing import Annotated
from pydantic import BaseModel, ConfigDict


router = APIRouter(prefix="/users", route_class=DishkaRoute)


class Cookies(BaseModel):
    sid: str
    model_config = ConfigDict(extra="ignore")


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
