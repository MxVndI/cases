import random
from uuid import UUID

from models.case import Case
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse, ItemResponse
from services.inventory import InventoryService
from services.item import ItemService


class CaseService:
    def __init__(
        self, item_service: ItemService, inventory_service: InventoryService = None
    ):
        self.item_service = item_service
        self.inventory_service = inventory_service

    async def create(self, data: CreateCase) -> UUID:
        items = list(map(lambda x: x.item_id, data.case_content))
        for id in items:
            item_data = await self.item_service.get_by_id(id)
            if not item_data:
                raise ValueError("Item does not exist")

        case = Case(**data.model_dump(exclude_none=True))
        await case.save()
        return case.id

    async def get(self):
        data = await Case.find_all().to_list()
        ret_data = []

        for x in data:
            dx = x.model_dump()
            dx["case_content"] = [
                (await self.item_service.get_by_id(y.item_id), y.drop_chance)
                for y in x.case_content
            ]
            ret_data.append(CaseResponse(**dx))
        return ret_data

    async def get_by_id(self, id: UUID):
        case = await Case.get(id)
        if not case:
            return None
        dx = case.model_dump()
        dx["case_content"] = [
            (await self.item_service.get_by_id(y.item_id), y.drop_chance)
            for y in case.case_content
        ]
        return CaseResponse(**dx)

    async def update(self, data: UpdateCase):
        case = await Case.get(data.id)
        if not case:
            raise ValueError("Case does not exist")

        if data.case_content:
            items = list(map(lambda x: x.item_id, data.case_content))
            for id in items:
                item_data = await self.item_service.get_by_id(id)
                if not item_data:
                    raise ValueError("Item does not exist")
        case_data = case.model_dump()
        for k, v in data.model_dump(exclude_none=True):
            case_data[k] = v

        case = Case(**case_data)

        await case.save()
        return case.id

    async def delete(self, id: UUID):
        return await Case.delete(Case.id == id)

    async def open(self, case_id: UUID, user_id: UUID) -> ItemResponse | None:
        case = await Case.get(case_id)
        if not case:
            return None

        if not case.case_content:
            return None

        # Взвешенный случайный выбор предмета на основе drop_chance
        items_with_chances = [
            (content.item_id, content.drop_chance) for content in case.case_content
        ]

        item_ids = [item_id for item_id, _ in items_with_chances]
        weights = [chance for _, chance in items_with_chances]

        chosen_item_id = random.choices(item_ids, weights=weights, k=1)[0]

        # Получаем данные о предмете
        won_item = await self.item_service.get_by_id(chosen_item_id)
        if not won_item:
            return None

        # Сохраняем предмет в инвентарь пользователя
        if self.inventory_service:
            await self.inventory_service.add_item(user_id, chosen_item_id)

        return won_item
