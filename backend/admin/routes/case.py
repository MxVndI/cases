from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse
from services.case import CaseService

router = APIRouter(prefix="/cases", route_class=DishkaRoute, tags=["Cases"])


@router.get("/", response_model=list[CaseResponse], summary="Получить все кейсы")
async def get_all_cases(cs: FromDishka[CaseService]):
    """Получить список всех кейсов"""
    try:
        cases = await cs.get()
        return cases or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{case_id}", response_model=CaseResponse, summary="Получить кейс по ID")
async def get_case(case_id: UUID, cs: FromDishka[CaseService]):
    """Получить кейс по его ID"""
    try:
        case = await cs.get_by_id(str(case_id))
        if not case:
            raise HTTPException(404, detail="Кейс не найден")
        return case
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", response_model=UUID, summary="Создать новый кейс")
async def create_case(cs: FromDishka[CaseService], case_data: CreateCase):
    """Создать новый кейс с предметами"""
    try:
        return await cs.create(case_data)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/", response_model=UUID, summary="Обновить кейс")
async def update_case(cs: FromDishka[CaseService], case_data: UpdateCase):
    """Обновить существующий кейс по ID"""
    try:
        return await cs.update(case_data)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{case_id}", summary="Удалить кейс")
async def delete_case(case_id: UUID, cs: FromDishka[CaseService]):
    """Удалить кейс по ID"""
    try:
        return await cs.delete(str(case_id))
    except Exception as e:
        raise HTTPException(500, detail=str(e))
