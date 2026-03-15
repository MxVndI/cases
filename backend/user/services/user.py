from uuid import UUID

from models.user import User
from pydantic import EmailStr
from services.redis_manager import RedisManager


class UserService:
    def __init__(self, redis_manager: RedisManager):
        self.redis_manager = redis_manager

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
