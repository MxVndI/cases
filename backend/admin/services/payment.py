from aiohttp import ClientSession
from loguru import logger
from settings import Settings

SYSTEM_UUID = "00000000-0000-0000-0000-000000000000"


class PaymentService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.payment_service_url
        self.session = session
        self.token = settings.token

    async def grant_balance(self, user_id: str, amount: float) -> dict | None:
        """Grant balance to a user by creating a transaction from the system account."""
        payload = {
            "currency": "CHC",
            "amount": amount,
            "to": user_id,
            "description": "Admin grant",
        }
        try:
            async with self.session.post(
                f"{self.base_url}/transaction/{SYSTEM_UUID}",
                json=payload,
            ) as response:
                if response.status == 200:
                    return {"ok": True, "message": await response.text()}
                else:
                    text = await response.text()
                    logger.error(f"Payment service error {response.status}: {text}")
                    return None
        except Exception as e:
            logger.error(f"Error granting balance: {e}")
            raise
