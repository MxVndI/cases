from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class AuthService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.auth_service_url
        self.settings = settings
        self.session = session

    async def get_uid(self, ssid):
        print(ssid)

        try:
            params = {"token": self.settings.token}
            async with self.session.get(
                f"{self.base_url}/verify_user/{ssid}", params=params
            ) as response:
                print(response)
                if response.status == 200:
                    data = await response.json()
                    print(data)
                    return data
                elif response.status == 404:
                    raise
                else:
                    logger.error(f"Case service error: {response.status}")
                    response.raise_for_status()
        except Exception as e:
            raise
