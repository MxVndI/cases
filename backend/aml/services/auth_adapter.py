from aiohttp import ClientSession, ClientTimeout
from fastapi import HTTPException

from settings import Settings


class AuthAdapter:
    def __init__(self, settings: Settings, session: ClientSession):
        self.settings = settings
        self.session = session

    async def get_admin_id_by_sid(self, sid: str) -> str:
        if not sid:
            raise HTTPException(status_code=401, detail="Missing sid cookie")
        try:
            async with self.session.get(
                f"{self.settings.auth_service_url}/verify_user/{sid}",
                params={"token": self.settings.token},
                timeout=ClientTimeout(total=5),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    uid = data.get("uid")
                    if uid:
                        return str(uid)
                raise HTTPException(status_code=401, detail="Invalid session")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=503, detail="Auth service unavailable")
