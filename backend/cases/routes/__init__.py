from fastapi import APIRouter

from .case import router as caser
from .item import router as itemr

router = APIRouter()

router.include_router(caser)
router.include_router(itemr)
