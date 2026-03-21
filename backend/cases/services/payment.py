from uuid import UUID

from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class PaymentService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.payment_service_url
        self.session = session

    async def get_balance(self, user_id: UUID) -> float:
        async with self.session.get(
            f"{self.base_url}/balance/{user_id}"
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                wallet = data.get("wallet", {})
                balances = wallet.get("balances", {})
                return balances.get("CHC", 0.0)
            logger.error(f"Payment service error: {resp.status}")
            return 0.0

    async def create_transaction(
        self, from_id: UUID, to_id: UUID, amount: float, description: str | None = None
    ) -> bool:
        payload = {
            "currency": "CHC",
            "amount": amount,
            "to": str(to_id),
        }
        if description:
            payload["description"] = description
        async with self.session.post(
            f"{self.base_url}/transaction/{from_id}",
            json=payload,
        ) as resp:
            if resp.status == 200:
                return True
            body = await resp.text()
            logger.error(f"Payment transaction failed: {resp.status} {body}")
            return False
