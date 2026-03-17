from uuid import UUID

from models.item import Item
from schemas.requests import CreateItem, UpdateItem
from schemas.responses import ItemResponse


class ItemService:
    async def create(self, data: CreateItem) -> UUID:

        item = Item(**data.model_dump(exclude_none=True))
        await item.save()
        return item.id

    async def get(self):
        items = await Item.find_all().to_list()
        im = list(map(lambda x: ItemResponse(**x.model_dump()), items))
        return im

    async def get_by_id(self, id: UUID) -> ItemResponse:
        item = await Item.get(id)
        if not item:
            raise ValueError("Item not found")
        return ItemResponse(**item.model_dump())

    async def update(self, data: UpdateItem):
        item = await Item.get(data.id)
        if not item:
            raise ValueError("Item not found")
        item_data = item.model_dump()
        for k, v in data.model_dump(exclude_none=True).items():
            item_data[k] = v

        item = Item(**item_data)

        await item.save()
        return item.id

    async def delete(self, id: UUID):
        item = await Item.find_one(Item.id == id)
        if not item:
            raise ValueError("Item not found")
        await item.delete()
        return True
