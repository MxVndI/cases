from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ioc import container
from routes import router
from services.db import connect_db


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


@app.get("/health")
def health():
    return "alive"


app.include_router(router)
setup_dishka(container, app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
