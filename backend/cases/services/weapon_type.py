from uuid import UUID

from models.weapon_type import WeaponType


class WeaponTypeService:
    async def create(self, name: str) -> WeaponType:
        existing = await WeaponType.find_one(WeaponType.name == name)
        if existing:
            return existing
        item = WeaponType(name=name)
        await item.save()
        return item

    async def get_all(self) -> list[WeaponType]:
        return await WeaponType.find_all().to_list()

    async def get_by_id(self, id: UUID) -> WeaponType | None:
        return await WeaponType.get(id)

    async def update(self, id: UUID, name: str | None = None) -> WeaponType | None:
        item = await WeaponType.get(id)
        if not item:
            return None
        if name is not None:
            item.name = name
        await item.save()
        return item

    async def delete(self, id: UUID) -> bool:
        item = await WeaponType.get(id)
        if not item:
            return False
        await item.delete()
        return True
