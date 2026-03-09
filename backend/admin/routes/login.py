from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends
from pydantic.main import BaseModel
from services.local_auth import LocalAuth

router = APIRouter(prefix="/login", route_class=DishkaRoute)


class LoginData(BaseModel):
    login: str
    password: str


@router.post("/")
async def login(data: LoginData, auth: FromDishka[LocalAuth]):

    return auth.verify_user(data.login, data.password)
