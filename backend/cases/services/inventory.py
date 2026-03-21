from uuid import UUID

from models.inventory import Inventory, InventoryItem


class InventoryService:
    async def get_by_user_id(self, user_id: UUID) -> Inventory | None:
        return await Inventory.find_one({"user_id": str(user_id)})

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

    async def remove_item(self, user_id: UUID, entry_id: UUID) -> InventoryItem | None:
        """Remove a single inventory entry by its unique id. Returns the removed entry or None."""
        inventory = await self.get_by_user_id(user_id)
        if not inventory:
            return None
        for idx, i in enumerate(inventory.items):
            if str(i.id) == str(entry_id):
                removed = inventory.items.pop(idx)
                await inventory.save()
                return removed
        return None

    async def remove_all(self, user_id: UUID) -> list[InventoryItem]:
        """Remove all items from inventory. Returns the removed entries."""
        inventory = await self.get_by_user_id(user_id)
        if not inventory or not inventory.items:
            return []
        removed = list(inventory.items)
        inventory.items = []
        await inventory.save()
        return removed
