from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ioc import container
from logging_setup import LoggingMiddleware, setup_logging
from routes.api import router
from services.database import connect_db
from settings import Settings

setup_logging(service_name=Settings().app_name, log_level=Settings().log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield


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
app.add_middleware(LoggingMiddleware)


@app.get("/health")
def health():
    return "alive"


app.include_router(router)


setup_dishka(container=container, app=app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
