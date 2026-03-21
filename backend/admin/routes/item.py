from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from routes.deps import require_admin
from schemas.requests import CreateItem, UpdateItem
from schemas.responses import ItemResponse
from services.item import ItemService

router = APIRouter(prefix="/items", route_class=DishkaRoute, tags=["Items"])


@router.get("/", response_model=list[ItemResponse], summary="Получить все предметы")
async def get_all_items(item_service: FromDishka[ItemService], _: str = Depends(require_admin)):
    """Получить список всех предметов"""
    try:
        items = await item_service.get_all()
        return items or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{item_id}", response_model=ItemResponse, summary="Получить предмет по ID")
async def get_item(item_id: UUID, item_service: FromDishka[ItemService], _: str = Depends(require_admin)):
    """Получить предмет по его ID"""
    try:
        item = await item_service.get_by_id(str(item_id))
        if not item:
            raise HTTPException(404, detail="Предмет не найден")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", response_model=UUID, summary="Создать новый предмет")
async def create_item(item_service: FromDishka[ItemService], item_data: CreateItem, _: str = Depends(require_admin)):
    """Создать новый предмет с указанными характеристиками"""
    try:
        return await item_service.create(item_data)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/", response_model=UUID, summary="Обновить предмет")
async def update_item(item_service: FromDishka[ItemService], item_data: UpdateItem, _: str = Depends(require_admin)):
    """Обновить существующий предмет по ID"""
    try:
        return await item_service.update(item_data)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{item_id}", summary="Удалить предмет")
async def delete_item(item_id: UUID, item_service: FromDishka[ItemService], _: str = Depends(require_admin)):
    """Удалить предмет по ID"""
    try:
        return await item_service.delete(str(item_id))
    except Exception as e:
        raise HTTPException(500, detail=str(e))
