from aiohttp import ClientSession
from loguru import logger
from schemas.requests import CreateItem, UpdateItem
from schemas.responses import ItemResponse
from settings import Settings


class ItemService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.case_service_url
        self.settings = settings
        self.session = session

    async def get_all(self):
        try:
            async with self.session.get(f"{self.base_url}/items/") as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def get_by_id(self, id: str):
        try:
            async with self.session.get(f"{self.base_url}/items/{id}") as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def create(self, data: CreateItem):
        try:
            payload = data.model_dump(mode="json")
            payload["token"] = self.settings.token
            async with self.session.post(
                f"{self.base_url}/items/", json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def update(self, data: UpdateItem):
        try:
            payload = data.model_dump(mode="json")
            payload["token"] = self.settings.token
            async with self.session.patch(
                f"{self.base_url}/items/", json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def delete(self, id: str):
        try:
            async with self.session.delete(
                f"{self.base_url}/items/{id}",
                params={"token": self.settings.token}
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise
