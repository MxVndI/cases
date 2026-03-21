from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from schemas.requests import CreateItem, UpdateItem
from schemas.responses import ItemResponse
from services.item import ItemService
from services.local_auth import LocalAuth

router = APIRouter(prefix="/items", route_class=DishkaRoute)


@router.get("/")
async def get_all(cs: FromDishka[ItemService]) -> list[ItemResponse]:
    try:
        return await cs.get()
    except:
        raise HTTPException(404)


@router.get("/{id}")
async def get_by_id(id: UUID, cs: FromDishka[ItemService]) -> ItemResponse | None:

    try:
        return await cs.get_by_id(id)
    except:
        raise HTTPException(404)


@router.post("/")
async def create(
    cs: FromDishka[ItemService], la: FromDishka[LocalAuth], cd: CreateItem
) -> UUID:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.create(cd)
    except:
        raise HTTPException(400)


@router.patch("/")
async def update(cs: FromDishka[ItemService], la: FromDishka[LocalAuth], cd: UpdateItem) -> UUID | None:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.update(cd)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))


@router.delete("/{id}")
async def delete(id: UUID, token: str, cs: FromDishka[ItemService], la: FromDishka[LocalAuth]):
    if not la.verify_token(token):
        raise HTTPException(403)
    return await cs.delete(id)
