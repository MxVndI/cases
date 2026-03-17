from uuid import UUID

from models.weapon import Weapon


class WeaponService:
    async def create(self, name: str, type: str) -> Weapon:
        existing = await Weapon.find_one(Weapon.name == name, Weapon.type == type)
        if existing:
            return existing
        item = Weapon(name=name, type=type)
        await item.save()
        return item

    async def get_all(self) -> list[Weapon]:
        return await Weapon.find_all().to_list()

    async def get_by_id(self, id: UUID) -> Weapon | None:
        return await Weapon.get(id)

    async def update(self, id: UUID, name: str | None = None, type: str | None = None) -> Weapon | None:
        item = await Weapon.get(id)
        if not item:
            return None
        if name is not None:
            item.name = name
        if type is not None:
            item.type = type
        await item.save()
        return item

    async def delete(self, id: UUID) -> bool:
        item = await Weapon.get(id)
        if not item:
            return False
        await item.delete()
        return True
