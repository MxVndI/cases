from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from routes.deps import require_admin
from schemas.requests import CreateWeapon, UpdateWeapon
from schemas.responses import WeaponEntityResponse
from services.weapon import WeaponService

router = APIRouter(prefix="/weapons", route_class=DishkaRoute, tags=["Weapons"])


@router.get("/", response_model=list[WeaponEntityResponse], summary="Получить все оружия")
async def get_all_weapons(ws: FromDishka[WeaponService], _: str = Depends(require_admin)):
    try:
        weapons = await ws.get_all()
        return weapons or []
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.get("/{weapon_id}", response_model=WeaponEntityResponse, summary="Получить оружие по ID")
async def get_weapon(weapon_id: UUID, ws: FromDishka[WeaponService], _: str = Depends(require_admin)):
    try:
        weapon = await ws.get_by_id(str(weapon_id))
        if not weapon:
            raise HTTPException(404, detail="Оружие не найдено")
        return weapon
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/", response_model=WeaponEntityResponse, summary="Создать оружие")
async def create_weapon(data: CreateWeapon, ws: FromDishka[WeaponService], _: str = Depends(require_admin)):
    try:
        return await ws.create(name=data.name, type=data.type)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.patch("/{weapon_id}", response_model=WeaponEntityResponse, summary="Обновить оружие")
async def update_weapon(weapon_id: UUID, data: UpdateWeapon, ws: FromDishka[WeaponService], _: str = Depends(require_admin)):
    try:
        result = await ws.update(str(weapon_id), name=data.name, type=data.type)
        if not result:
            raise HTTPException(404, detail="Оружие не найдено")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.delete("/{weapon_id}", summary="Удалить оружие")
async def delete_weapon(weapon_id: UUID, ws: FromDishka[WeaponService], _: str = Depends(require_admin)):
    try:
        result = await ws.delete(str(weapon_id))
        if not result:
            raise HTTPException(404, detail="Оружие не найдено")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))