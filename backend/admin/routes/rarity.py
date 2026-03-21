from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from routes.deps import require_admin
from services.rarity import RarityService

router = APIRouter(prefix="/rarities", route_class=DishkaRoute, tags=["Rarities"])


class CreateRarityRequest(BaseModel):
    name: str = Field(min_length=1)
    color: str = Field(min_length=1)


class UpdateRarityRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    color: str | None = Field(default=None, min_length=1)


@router.get("/", summary="Получить все редкости")
async def get_all(rs: FromDishka[RarityService], _: str = Depends(require_admin)):
    try:
        rarities = await rs.get_all()
        return rarities or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{rarity_id}", summary="Получить редкость по ID")
async def get_by_id(rarity_id: str, rs: FromDishka[RarityService], _: str = Depends(require_admin)):
    try:
        rarity = await rs.get_by_id(rarity_id)
        if not rarity:
            raise HTTPException(404, detail="Редкость не найдена")
        return rarity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", summary="Создать редкость")
async def create(data: CreateRarityRequest, rs: FromDishka[RarityService], _: str = Depends(require_admin)):
    try:
        return await rs.create(name=data.name, color=data.color)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/{rarity_id}", summary="Обновить редкость")
async def update(rarity_id: str, data: UpdateRarityRequest, rs: FromDishka[RarityService], _: str = Depends(require_admin)):
    try:
        result = await rs.update(rarity_id, name=data.name, color=data.color)
        if not result:
            raise HTTPException(404, detail="Редкость не найдена")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{rarity_id}", summary="Удалить редкость")
async def delete(rarity_id: str, rs: FromDishka[RarityService], _: str = Depends(require_admin)):
    try:
        result = await rs.delete(rarity_id)
        if not result:
            raise HTTPException(404, detail="Редкость не найдена")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
