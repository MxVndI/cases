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

    async def get_user_by_nickname(self, nickname: str):
        data = await User.find_one(User.nickname == nickname)
        return data

    async def get_user_by_email(self, email: EmailStr):
        """Gets user, maybe creates"""
        data = await User.find_one(User.email == email)
        if not data:
            data = User(email=email)
            await data.save()

        return data

    async def update_user(self, user_id: str | UUID, **fields) -> User | None:
        user = await User.get(user_id)
        if not user:
            return None
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        await user.save()
        return user

    async def update_status(self, user_id: str | UUID, new_status: str) -> User | None:
        user = await User.get(user_id)
        if not user:
            return None
        user.status = new_status
        await user.save()
        return user

    async def get_users(
        self,
        search: str | None = None,
        status: str | None = None,
        role: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        query = {}
        if status:
            query["status"] = status
        if role:
            query["role"] = role
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"nickname": {"$regex": search, "$options": "i"}},
            ]

        total = await User.find(query).count()
        skip = (page - 1) * limit
        users = await User.find(query).skip(skip).limit(limit).to_list()
        return users, total
