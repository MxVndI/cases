from faststream.redis import RedisRouter, RedisMessage, Redis, StreamSub
from faststream import Logger
from dishka import FromDishka

from services.user import UserService
from settings import Settings
import json

settings = Settings()

router = RedisRouter()


@router.subscriber(stream=StreamSub("user.rpc"))
async def handle_rpc(
    msg: dict,
    logger: Logger,
    user_service: FromDishka[UserService],
):
    logger.info(f"incoming msg: {msg}")
    data = await user_service.handle_rpc(msg)
    logger.info(f"returm msg: {data}")

    return json.dumps(data)
