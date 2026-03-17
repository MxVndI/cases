from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from services.local_auth import LocalAuth
from services.rarity import RarityService

router = APIRouter(prefix="/rarities", route_class=DishkaRoute)


class CreateRarityRequest(BaseModel):
    name: str
    color: str
    token: str


class UpdateRarityRequest(BaseModel):
    name: str | None = None
    color: str | None = None
    token: str


@router.get("/")
async def get_all(rs: FromDishka[RarityService]):
    return await rs.get_all()


@router.get("/{id}")
async def get_by_id(id: UUID, rs: FromDishka[RarityService]):
    rarity = await rs.get_by_id(id)
    if not rarity:
        raise HTTPException(404, detail="Rarity not found")
    return rarity


@router.post("/")
async def create(data: CreateRarityRequest, rs: FromDishka[RarityService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    return await rs.create(name=data.name, color=data.color)


@router.patch("/{id}")
async def update(id: UUID, data: UpdateRarityRequest, rs: FromDishka[RarityService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    rarity = await rs.update(id, name=data.name, color=data.color)
    if not rarity:
        raise HTTPException(404, detail="Rarity not found")
    return rarity


@router.delete("/{id}")
async def delete(id: UUID, token: str, rs: FromDishka[RarityService], la: FromDishka[LocalAuth]):
    if not la.verify_token(token):
        raise HTTPException(403)
    ok = await rs.delete(id)
    if not ok:
        raise HTTPException(404, detail="Rarity not found")
    return {"ok": True}
