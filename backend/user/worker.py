import logging
from faststream import FastStream
from faststream.redis import RedisBroker
from settings import settings
from routes.broker.main import router
from dishka.integrations.faststream import setup_dishka
from services.database import connect_db
from ioc import container

logger = logging.getLogger(__name__)
broker = RedisBroker(url=settings.redis_url)
broker.include_router(router)
app = FastStream(broker)


@app.on_startup
async def on_startup():

    await connect_db()


setup_dishka(container=container, app=app, auto_inject=True)
if __name__ == "__main__":
    import asyncio

    asyncio.run(app.run())
