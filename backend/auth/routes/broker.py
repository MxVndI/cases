from faststream.redis import RedisRouter, RedisMessage, Redis, StreamSub
from faststream import Logger
from dishka import FromDishka

from services import AuthService
from settings import Settings


settings = Settings()

router = RedisRouter()


@router.subscriber(stream=StreamSub("auth.rpc", maxlen=100))
async def validate_sid(
    msg: dict,
    logger: Logger,
    auth_service: FromDishka[AuthService],
):
    logger.info(f"incoming msg: {msg}")
    data = await auth_service.verify_session_handler(msg)
    logger.info(f"returm msg: {data}")

    return data
