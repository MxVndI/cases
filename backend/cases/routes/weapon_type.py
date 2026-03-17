from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from services.local_auth import LocalAuth
from services.weapon_type import WeaponTypeService

router = APIRouter(prefix="/weapon-types", route_class=DishkaRoute)


class CreateWeaponTypeRequest(BaseModel):
    name: str
    token: str


class UpdateWeaponTypeRequest(BaseModel):
    name: str | None = None
    token: str


@router.get("/")
async def get_all(ws: FromDishka[WeaponTypeService]):
    return await ws.get_all()


@router.get("/{id}")
async def get_by_id(id: UUID, ws: FromDishka[WeaponTypeService]):
    item = await ws.get_by_id(id)
    if not item:
        raise HTTPException(404, detail="Weapon type not found")
    return item


@router.post("/")
async def create(data: CreateWeaponTypeRequest, ws: FromDishka[WeaponTypeService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    return await ws.create(name=data.name)


@router.patch("/{id}")
async def update(id: UUID, data: UpdateWeaponTypeRequest, ws: FromDishka[WeaponTypeService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    item = await ws.update(id, name=data.name)
    if not item:
        raise HTTPException(404, detail="Weapon type not found")
    return item


@router.delete("/{id}")
async def delete(id: UUID, token: str, ws: FromDishka[WeaponTypeService], la: FromDishka[LocalAuth]):
    if not la.verify_token(token):
        raise HTTPException(403)
    ok = await ws.delete(id)
    if not ok:
        raise HTTPException(404, detail="Weapon type not found")
    return {"ok": True}
