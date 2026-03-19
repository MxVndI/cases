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
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    async def create_user(self, email: str):
        """Создать пользователя через вызов user API"""
        try:
            async with self.session.post(
                f"{self.base_url}/v1/users/", json={"email": email}, headers=self._headers()
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

    async def get_users(
        self,
        search: str | None = None,
        status: str | None = None,
        role: str | None = None,
        page: int = 1,
        limit: int = 20,
    ):
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if status:
            params["status"] = status
        if role:
            params["role"] = role
        try:
            async with self.session.get(
                f"{self.base_url}/v1/users/", params=params, headers=self._headers()
            ) as response:
                if response.status == 200:
                    return await response.json()
                logger.error(f"User service error: {response.status}")
                return None
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            raise

    async def block_user(self, user_id: str):
        return await self._update_status(user_id, "blocked")

    async def unblock_user(self, user_id: str):
        return await self._update_status(user_id, "active")

    async def update_role(self, user_id: str, new_role: str):
        try:
            async with self.session.patch(
                f"{self.base_url}/v1/users/{user_id}/role",
                json={"role": new_role},
                headers=self._headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"User service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            logger.error(f"Error updating role: {e}")
            raise

    async def _update_status(self, user_id: str, new_status: str):
        try:
            async with self.session.patch(
                f"{self.base_url}/v1/users/{user_id}/status",
                json={"status": new_status},
                headers=self._headers(),
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"User service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            logger.error(f"Error updating user status: {e}")
            raise
