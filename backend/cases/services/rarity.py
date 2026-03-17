from uuid import UUID

from models.rarity import Rarity


class RarityService:
    async def create(self, name: str, color: str) -> Rarity:
        rarity = Rarity(name=name, color=color)
        await rarity.save()
        return rarity

    async def get_all(self) -> list[Rarity]:
        return await Rarity.find_all().to_list()

    async def get_by_id(self, id: UUID) -> Rarity | None:
        return await Rarity.get(id)

    async def update(self, id: UUID, **fields) -> Rarity | None:
        rarity = await Rarity.get(id)
        if not rarity:
            return None
        for key, value in fields.items():
            if value is not None:
                setattr(rarity, key, value)
        await rarity.save()
        return rarity

    async def delete(self, id: UUID) -> bool:
        rarity = await Rarity.get(id)
        if not rarity:
            return False
        await rarity.delete()
        return True
