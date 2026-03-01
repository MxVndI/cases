from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import v1_router
import uvicorn
import logging
from services.database import connect_db
from ioc import container
from dishka.integrations.fastapi import setup_dishka

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    await connect_db()
    yield


app = FastAPI(lifespan=lifespan)
setup_dishka(container, app)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(v1_router)


@app.get("/health")
def health():
    return "alive"


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True)
