from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class UserService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.user_service_url
        self.settings = settings
        self.session = session
        self.token = settings.token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def get_user_by_id(self, user_id: str):
        try:
            async with self.session.get(
                f"{self.base_url}/v1/users/{user_id}",
                headers=self._headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                if response.status == 404:
                    return None
                logger.error(f"User service error: {response.status}")
                response.raise_for_status()
        except Exception as e:
            logger.error(f"Error fetching user by id: {e}")
            return None
