from contextlib import asynccontextmanager

import uvicorn
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from ioc import container
from routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Admin API",
    description="API для управления предметами и кейсами",
    version="0.1",
    lifespan=lifespan,
    docs_url=None,  # Отключаем стандартный /docs
    redoc_url=None,
)

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


@app.get("/docs", include_in_schema=False)
async def get_docs():
    """Swagger UI для Admin API"""
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Admin API - Swagger UI",
        swagger_ui_parameters={"defaultModelsExpandDepth": -1},
    )


app.include_router(router)
setup_dishka(container, app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8012, proxy_headers=True)
