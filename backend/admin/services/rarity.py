from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class RarityService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.case_service_url
        self.settings = settings
        self.session = session

    async def get_all(self):
        try:
            async with self.session.get(f"{self.base_url}/rarities/") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Rarity service error: {response.status}")
                    return None
        except Exception as e:
            raise

    async def get_by_id(self, id: str):
        try:
            async with self.session.get(f"{self.base_url}/rarities/{id}") as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Rarity service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def create(self, name: str, color: str):
        try:
            payload = {"name": name, "color": color, "token": self.settings.token}
            async with self.session.post(
                f"{self.base_url}/rarities/", json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Rarity service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def update(self, id: str, name: str | None = None, color: str | None = None):
        try:
            payload = {"token": self.settings.token}
            if name is not None:
                payload["name"] = name
            if color is not None:
                payload["color"] = color
            async with self.session.patch(
                f"{self.base_url}/rarities/{id}", json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Rarity service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise

    async def delete(self, id: str):
        try:
            async with self.session.delete(
                f"{self.base_url}/rarities/{id}", params={"token": self.settings.token}
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Rarity service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise
