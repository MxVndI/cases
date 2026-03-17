from aiohttp import ClientSession
from fastapi import HTTPException
from loguru import logger
from settings import Settings


class AdminAuth:
    def __init__(self, settings: Settings, session: ClientSession):
        self.settings = settings
        self.session = session
        self.auth_service_url = settings.auth_service_url
        self.user_service_url = settings.user_service_url
        self.token = settings.token

    async def get_admin_user_id(self, sid: str) -> str:
        """Verify session via auth service, then check user role is admin."""
        # Step 1: Verify session with auth service
        try:
            async with self.session.get(
                f"{self.auth_service_url}/verify_user/{sid}",
                params={"token": self.token},
            ) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=401, detail="Invalid session")
                data = await resp.json()
                uid = data.get("uid")
                if not uid:
                    raise HTTPException(status_code=401, detail="Invalid session")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Auth service error: {e}")
            raise HTTPException(status_code=503, detail="Auth service unavailable")

        # Step 2: Get user from user service, check role
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            async with self.session.get(
                f"{self.user_service_url}/v1/users/{uid}",
                headers=headers,
            ) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=401, detail="User not found")
                user_data = await resp.json()
                if user_data.get("role") != "admin":
                    raise HTTPException(status_code=403, detail="Admin access required")
                return uid
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"User service error: {e}")
            raise HTTPException(status_code=503, detail="User service unavailable")
