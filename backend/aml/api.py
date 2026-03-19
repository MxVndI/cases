from contextlib import asynccontextmanager

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ioc import container
from logging_setup import LoggingMiddleware, setup_logging
from routes.access import router as access_router
from routes.admin_ops import router as ops_router
from routes.bootstrap import router as bootstrap_router
from routes.proxy import router as proxy_router
from routes.secret import router as secret_router
from routes.ui import router as ui_router
from services.database import connect_db
from settings import settings

setup_logging(service_name=settings.app_name, log_level=settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield


app = FastAPI(lifespan=lifespan)

origins = [settings.frontend_url]
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

app.include_router(ui_router)
app.include_router(access_router)
app.include_router(bootstrap_router)
app.include_router(proxy_router)
app.include_router(secret_router)
app.include_router(ops_router)

setup_dishka(container=container, app=app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
