from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from services.local_auth import LocalAuth
from services.tag import TagService

router = APIRouter(prefix="/tags", route_class=DishkaRoute)


class CreateTagRequest(BaseModel):
    name: str
    token: str


class UpdateTagRequest(BaseModel):
    name: str | None = None
    token: str


@router.get("/")
async def get_all(ts: FromDishka[TagService]):
    return await ts.get_all()


@router.get("/{id}")
async def get_by_id(id: UUID, ts: FromDishka[TagService]):
    tag = await ts.get_by_id(id)
    if not tag:
        raise HTTPException(404, detail="Tag not found")
    return tag


@router.post("/")
async def create(data: CreateTagRequest, ts: FromDishka[TagService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    try:
        return await ts.create(name=data.name)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc))


@router.patch("/{id}")
async def update(id: UUID, data: UpdateTagRequest, ts: FromDishka[TagService], la: FromDishka[LocalAuth]):
    if not la.verify_token(data.token):
        raise HTTPException(403)
    try:
        tag = await ts.update(id, name=data.name)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc))
    if not tag:
        raise HTTPException(404, detail="Tag not found")
    return tag


@router.delete("/{id}")
async def delete(id: UUID, token: str, ts: FromDishka[TagService], la: FromDishka[LocalAuth]):
    if not la.verify_token(token):
        raise HTTPException(403)
    ok = await ts.delete(id)
    if not ok:
        raise HTTPException(404, detail="Tag not found")
    return {"ok": True}