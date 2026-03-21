from aiohttp import ClientSession
from loguru import logger
from schemas.requests import CalculateChancesRequest, CreateCase, UpdateCase
from schemas.responses import CaseResponse
from settings import Settings


class CaseService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.case_service_url
        self.settings = settings
        self.session = session
        self.token = settings.token

    async def get(self):
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.get(
                f"{self.base_url}/cases/", headers=headers
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

    async def get_by_id(self, id: str):
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.get(
                f"{self.base_url}/cases/{id}", headers=headers
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

    async def create(self, data: CreateCase):
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            payload = data.model_dump(mode="json")
            payload["token"] = self.token
            async with self.session.post(
                f"{self.base_url}/cases/", json=payload, headers=headers
            ) as response:
                if response.status in (200, 201):
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def update(self, data: UpdateCase):
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            payload = data.model_dump(mode="json")
            payload["token"] = self.token
            async with self.session.patch(
                f"{self.base_url}/cases/", json=payload, headers=headers
            ) as response:
                if response.status in (200, 201):
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def calculate_chances(self, data: CalculateChancesRequest):
        try:
            payload = {"item_ids": [str(i) for i in data.item_ids], "token": self.token}
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.post(
                f"{self.base_url}/cases/calculate_chances",
                json=payload,
                headers=headers,
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def calculate_price(self, data) -> dict:
        try:
            payload = {
                "items": [{"item_id": str(i.item_id), "drop_chance": i.drop_chance} for i in data.items],
                "margin": data.margin,
                "token": self.token,
            }
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.post(
                f"{self.base_url}/cases/calculate_price",
                json=payload,
                headers=headers,
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def delete(self, id: str):
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.delete(
                f"{self.base_url}/cases/{id}", params={"token": self.token}, headers=headers
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
