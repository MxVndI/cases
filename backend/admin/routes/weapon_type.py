from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from routes.deps import require_admin
from schemas.requests import CreateWeaponType, UpdateWeaponType
from schemas.responses import WeaponTypeResponse
from services.weapon_type import WeaponTypeService

router = APIRouter(prefix="/weapon-types", route_class=DishkaRoute, tags=["Weapon Types"])


@router.get("/", response_model=list[WeaponTypeResponse], summary="Получить все типы оружия")
async def get_all_weapon_types(wts: FromDishka[WeaponTypeService], _: str = Depends(require_admin)):
    try:
        types = await wts.get_all()
        return types or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{weapon_type_id}", response_model=WeaponTypeResponse, summary="Получить тип оружия по ID")
async def get_weapon_type(weapon_type_id: UUID, wts: FromDishka[WeaponTypeService], _: str = Depends(require_admin)):
    try:
        weapon_type = await wts.get_by_id(str(weapon_type_id))
        if not weapon_type:
            raise HTTPException(404, detail="Тип оружия не найден")
        return weapon_type
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", response_model=WeaponTypeResponse, summary="Создать тип оружия")
async def create_weapon_type(data: CreateWeaponType, wts: FromDishka[WeaponTypeService], _: str = Depends(require_admin)):
    try:
        return await wts.create(name=data.name)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/{weapon_type_id}", response_model=WeaponTypeResponse, summary="Обновить тип оружия")
async def update_weapon_type(weapon_type_id: UUID, data: UpdateWeaponType, wts: FromDishka[WeaponTypeService], _: str = Depends(require_admin)):
    try:
        result = await wts.update(str(weapon_type_id), name=data.name)
        if not result:
            raise HTTPException(404, detail="Тип оружия не найден")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{weapon_type_id}", summary="Удалить тип оружия")
async def delete_weapon_type(weapon_type_id: UUID, wts: FromDishka[WeaponTypeService], _: str = Depends(require_admin)):
    try:
        result = await wts.delete(str(weapon_type_id))
        if not result:
            raise HTTPException(404, detail="Тип оружия не найден")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))