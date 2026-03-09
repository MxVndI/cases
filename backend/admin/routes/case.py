from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse
from services.case import CaseService

router = APIRouter(prefix="/cases", route_class=DishkaRoute)


@router.get("/")
async def get_all(cs: FromDishka[CaseService]):

    try:
        return await cs.get()
    except:
        raise HTTPException(404)


@router.get("/{id}")
async def get_by_id(id: UUID, cs: FromDishka[CaseService]):

    try:
        return await cs.get_by_id(id)
    except:
        raise HTTPException(404)


@router.post("/")
async def create(cs: FromDishka[CaseService], cd: CreateCase):

    try:
        return await cs.create(cd)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.patch("/")
async def update(cs: FromDishka[CaseService], cd: UpdateCase):

    try:
        return await cs.update(cd)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.delete("/{id}")
async def delete(id: UUID, cs: FromDishka[CaseService]):
    return await cs.delete(id)
