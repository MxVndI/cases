from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class UserService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.user_service_url
        self.settings = settings
        self.session = session
        self.token = settings.secret

    async def create_user(self, email: str):
        """Создать пользователя через вызов user API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            }
            async with self.session.post(
                f"{self.base_url}/users/", json={"email": email}, headers=headers
            ) as response:
                if response.status in (200, 201):
                    return await response.json()
                elif response.status == 403:
                    logger.error("Invalid token for user creation")
                    return None
                else:
                    logger.error(f"User service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
