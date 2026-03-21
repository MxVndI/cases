from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from services.local_auth import LocalAuth
from services.weapon import WeaponService

router = APIRouter(prefix="/weapons", route_class=DishkaRoute)


class CreateWeaponRequest(BaseModel):
    name: str
    type: str
    token: str


class UpdateWeaponRequest(BaseModel):
    name: str | None = None
    type: str | None = None
    token: str


@router.get("/")
async def get_all(ws: FromDishka[WeaponService]):
    return await ws.get_all()


@router.get("/{id}")
async def get_by_id(id: UUID, ws: FromDishka[WeaponService]):
    item = await ws.get_by_id(id)
    if not item:
        raise HTTPException(404, detail="Weapon not found")
    return item


@router.post("/")
async def create(data: CreateWeaponRequest, ws: FromDishka[WeaponService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    return await ws.create(name=data.name, type=data.type)


@router.patch("/{id}")
async def update(id: UUID, data: UpdateWeaponRequest, ws: FromDishka[WeaponService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    item = await ws.update(id, name=data.name, type=data.type)
    if not item:
        raise HTTPException(404, detail="Weapon not found")
    return item


@router.delete("/{id}")
async def delete(id: UUID, token: str, ws: FromDishka[WeaponService], la: FromDishka[LocalAuth]):
    if not la.verify_token(token):
        raise HTTPException(403)
    ok = await ws.delete(id)
    if not ok:
        raise HTTPException(404, detail="Weapon not found")
    return {"ok": True}
