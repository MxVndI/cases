from uuid import UUID

from models.inventory import Inventory, InventoryItem


class InventoryService:
    async def get_by_user_id(self, user_id: UUID) -> Inventory | None:
        return await Inventory.find_one(Inventory.user_id == user_id)

    async def add_item(self, user_id: UUID, item_id: UUID) -> Inventory:
        inventory = await self.get_by_user_id(user_id)

        if inventory:
            inventory.items.append(InventoryItem(item_id=item_id))
            await inventory.save()
            return inventory
        else:
            inventory = Inventory(
                user_id=user_id, items=[InventoryItem(item_id=item_id)]
            )
            await inventory.save()
            return inventory

    async def get_items(self, user_id: UUID) -> list[InventoryItem]:
        inventory = await self.get_by_user_id(user_id)
        if inventory:
            return inventory.items
        return []
