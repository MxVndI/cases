from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie
from fastapi.exceptions import HTTPException
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse
from services.auth import AuthService
from services.case import CaseService
from services.local_auth import LocalAuth

router = APIRouter(prefix="/cases", route_class=DishkaRoute)


@router.get("/")
async def get_all(cs: FromDishka[CaseService]) -> list[CaseResponse]:

    try:
        return await cs.get()
    except:
        raise HTTPException(404)


@router.get("/{id}")
async def get_by_id(id: UUID, cs: FromDishka[CaseService]) -> CaseResponse | None:

    try:
        return await cs.get_by_id(id)
    except:
        raise HTTPException(404)


@router.post("/")
async def create(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], cd: CreateCase
) -> UUID:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.create(cd)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.patch("/")
async def update(
    cs: FromDishka[CaseService], la: FromDishka[LocalAuth], cd: UpdateCase
) -> UUID | None:
    if not la.verify_token(cd.token):
        raise HTTPException(403)
    try:
        return await cs.update(cd)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.delete("/{id}")
async def delete(
    id: UUID, token: str, cs: FromDishka[CaseService], la: FromDishka[LocalAuth]
):
    if not la.verify_token(token):
        raise HTTPException(403)
    return await cs.delete(id)


@router.get("/open/{id}")
async def open(
    id: UUID,
    sid: Annotated[str | None, Cookie()],
    cs: FromDishka[CaseService],
    auth: FromDishka[AuthService],
):
    print(auth.__class__.__name__)
    print(sid)
    uid = await auth.get_uid(sid)
    return uid
