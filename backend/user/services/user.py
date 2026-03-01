from faststream.redis import RedisBroker
from pydantic import EmailStr
from models.user import User
from uuid import UUID


class UserService:
    def __init__(self, redis_broker: RedisBroker):
        self.redis = redis_broker

    async def handle_rpc(self, msg: dict):
        if msg.get("action") == "get":
            if mail := msg.get("email"):
                us = await self.get_user_by_email(mail)
                return us.model_dump()
        raise

    async def get_user_by_id(self, id: str | UUID):

        data = await User.get(id)

        return data

    async def get_user_by_email(self, email: EmailStr):
        """Gets user, maybe creates"""
        data = await User.find_one(User.email == email)
        if not data:
            data = User(email=email)
            await data.save()

        return data
