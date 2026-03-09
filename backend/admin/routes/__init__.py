from fastapi import APIRouter

from .case import router as case_router
from .login import router as log_router

router = APIRouter()

router.include_router(log_router)
router.include_router(case_router)
