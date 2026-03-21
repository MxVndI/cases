import asyncio
import json
import logging
from contextlib import asynccontextmanager

from prometheus_client import Gauge
from prometheus_fastapi_instrumentator import Instrumentator

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ioc import container
from routes.api import router
from services.database import connect_db
from services.redis_manager import RedisManager
from settings import Settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

active_users_gauge = Gauge("active_users", "Number of unique users with active sessions")
active_sessions_gauge = Gauge("active_sessions", "Number of active sessions in Redis")


async def _update_session_gauges(redis_manager: RedisManager):
    """Background task: count sid:* keys and distinct emails every 15s."""
    while True:
        try:
            async with redis_manager.get_client_context() as client:
                emails = set()
                session_count = 0
                async for key in client.scan_iter(match="sid:*", count=100):
                    session_count += 1
                    raw = await client.get(key)
                    if raw:
                        try:
                            data = json.loads(raw)
                            email = data.get("email")
                            if email:
                                emails.add(email)
                        except (json.JSONDecodeError, TypeError):
                            pass
                active_sessions_gauge.set(session_count)
                active_users_gauge.set(len(emails))
        except Exception:
            logger.exception("Failed to update session gauges")
        await asyncio.sleep(15)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    settings = Settings()
    redis_manager = RedisManager(settings)
    task = asyncio.create_task(_update_session_gauges(redis_manager))
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)

Instrumentator().instrument(app).expose(app)

origins = ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return "alive"


app.include_router(router)


setup_dishka(container=container, app=app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
