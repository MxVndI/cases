import json

import aiohttp
from settings import Settings


class SessionService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.auth_service_url = (
            settings.auth_service_url
            if hasattr(settings, "auth_service_url")
            else "http://localhost:8000"
        )

    async def get_user_id_by_sid(self, sid: str):
        """Получает user_id по session id через запрос к auth сервису"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.auth_service_url}/verify_user/{sid}",
                params={"token": self.settings.token},
                timeout=aiohttp.ClientTimeout(total=5),
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("uid")
                return None
