from uuid import UUID

from models.case import Case
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseResponse, ItemResponse
from services.item import ItemService


class CaseService:
    def __init__(self, item_service: ItemService):
        self.item_service = item_service

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
