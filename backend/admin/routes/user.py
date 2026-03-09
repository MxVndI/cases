from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/users", route_class=DishkaRoute)
