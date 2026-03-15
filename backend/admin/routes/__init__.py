from fastapi import APIRouter

from .case import router as case_router
from .item import router as item_router
from .login import router as auth_router
from .user import router as user_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(case_router)
router.include_router(item_router)
router.include_router(user_router)
