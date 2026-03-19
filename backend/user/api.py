from contextlib import asynccontextmanager

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from ioc import container
from logging_setup import LoggingMiddleware, setup_logging
from routes import v1_router
from services.database import connect_db
from settings import settings

setup_logging(service_name=settings.app_name, log_level=settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield


app = FastAPI(
    title="User API",
    description="API для управления пользователями",
    version="0.1",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)
setup_dishka(container, app)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)
app.include_router(v1_router)


@app.get("/health")
def health():
    return "alive"


@app.get("/docs", include_in_schema=False)
async def get_docs():
    """Swagger UI для User API"""
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="User API - Swagger UI",
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
