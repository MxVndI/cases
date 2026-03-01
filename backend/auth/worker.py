import logging
from faststream import FastStream
from faststream.redis import RedisBroker
from routes.broker import router
from settings import Settings
from ioc import container
from dishka.integrations.faststream import setup_dishka
from services.database import connect_db

settings = Settings()
logger = logging.getLogger(__name__)
broker = RedisBroker(url=settings.redis_url)
broker.include_router(router)
app = FastStream(broker)


@app.on_startup
async def setup():
    await connect_db()


setup_dishka(container=container, app=app, auto_inject=True)
if __name__ == "__main__":
    import asyncio

    asyncio.run(app.run())
