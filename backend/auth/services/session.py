from datetime import UTC, datetime
from uuid import UUID

from models.session import Session
from pydantic import EmailStr
from repos.session import SessionRepo


class SessionService:
    def __init__(self, repo: SessionRepo):
        self.repo = repo

    async def create_session(
        self, email: EmailStr, provider: str, user_data: dict | None = None
    ) -> UUID:
        session_data = Session(
            email=email,
            auth_source=provider,
            custom_data={"user": user_data},
        )
        data = await self.repo.create(session_data)

        return data.id

    async def get_session(self, session_id: UUID) -> Session | None:

        data = await self.repo.get(session_id)

        return data

    async def get_session_user(self, session_id: UUID) -> dict[str, str] | None:

        data = await self.repo.get(session_id)
        if data:
            return data.custom_data.get("user")

        return data

    async def delete_session(self, session_id: UUID):
        await self.repo.delete(session_id)

    async def update_session_user_info(
        self, session_id: UUID, user_info: dict
    ) -> Session | None:
        """Обновление данных сессии"""
        session = await self.get_session(session_id)
        if not session:
            return None

        if session.custom_data.get("user"):
            session.custom_data["user"].update(user_info)
        else:
            session.custom_data["user"] = user_info

        session.last_activity = datetime.now(tz=UTC)
        await session.save()
        await self.repo.redis.create(
            prefix=self.repo.prefix,
            key=str(session_id),
            value=session.model_dump(),
            ttl=int(
                (
                    session.expires_at.astimezone(tz=UTC) - datetime.now(tz=UTC)
                ).total_seconds()
            ),
        )

        return session

    async def update_session(self, session_id: UUID, **kwargs) -> Session | None:
        """Обновление данных сессии"""
        session = await self.get_session(session_id)
        if not session:
            return None

        session = session.model_copy(update=kwargs)

        session.last_activity = datetime.now(tz=UTC)
        await session.save()
        await self.repo.redis.create(
            prefix=self.repo.prefix,
            key=str(session_id),
            value=session.model_dump(),
            ttl=int(
                (
                    session.expires_at.astimezone(tz=UTC) - datetime.now(tz=UTC)
                ).total_seconds()
            ),
        )

        return session

    async def delete_session(self, session_id: UUID):
        """Удаление сессии"""
        sd = await Session.get(session_id)
        if sd:
            await sd.delete()
        await self.repo.redis.delete(f"{self.repo.prefix}{session_id}")

    # TODO  check for user_id in custom_data
    # async def delete_user_sessions(self, user_id: UUID):
    #     """Удаление всех сессий пользователя (при смене пароля и т.д.)"""
    #     # В реальном приложении нужен индекс user_id -> session_id
    #     # Для простоты используем сканирование (осторожно в production!)

    #     sessions = await SessionData.find_all(user_id=user_id)
    #     for x in sessions:
    #         await x.delete()

    #     cursor = 0
    #     while True:
    #         cursor, keys = await self.redis.scan(cursor=cursor, match=f"{self.prefix}*")

    #         for key in keys:
    #             data = await self.redis.get(key)
    #             if data:
    #                 session = SessionData(**data)
    #                 if session.user_id == user_id:
    #                     await self.redis.delete(key)

    #         if cursor == 0:
    #             break
