from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from routes.deps import require_admin
from schemas.requests import CreateTag, UpdateTag
from schemas.responses import TagResponse
from services.tag import TagService

router = APIRouter(prefix="/tags", route_class=DishkaRoute, tags=["Tags"])


@router.get("/", response_model=list[TagResponse], summary="Получить все теги")
async def get_all_tags(ts: FromDishka[TagService], _: str = Depends(require_admin)):
    try:
        tags = await ts.get_all()
        return tags or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{tag_id}", response_model=TagResponse, summary="Получить тег по ID")
async def get_tag(tag_id: UUID, ts: FromDishka[TagService], _: str = Depends(require_admin)):
    try:
        tag = await ts.get_by_id(str(tag_id))
        if not tag:
            raise HTTPException(404, detail="Тег не найден")
        return tag
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", response_model=TagResponse, summary="Создать тег")
async def create_tag(data: CreateTag, ts: FromDishka[TagService], _: str = Depends(require_admin)):
    try:
        return await ts.create(name=data.name)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/{tag_id}", response_model=TagResponse, summary="Обновить тег")
async def update_tag(tag_id: UUID, data: UpdateTag, ts: FromDishka[TagService], _: str = Depends(require_admin)):
    try:
        result = await ts.update(str(tag_id), name=data.name)
        if not result:
            raise HTTPException(404, detail="Тег не найден")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{tag_id}", summary="Удалить тег")
async def delete_tag(tag_id: UUID, ts: FromDishka[TagService], _: str = Depends(require_admin)):
    try:
        result = await ts.delete(str(tag_id))
        if not result:
            raise HTTPException(404, detail="Тег не найден")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))