import logging
from contextlib import asynccontextmanager

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ioc import container
from routes.api import router
from services.database import connect_db

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield


app = FastAPI(lifespan=lifespan)

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
