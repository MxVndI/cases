from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from routes.deps import require_admin
from services.storage import StorageService

router = APIRouter(prefix="/upload", route_class=DishkaRoute, tags=["Upload"])

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/image", summary="Загрузить изображение")
async def upload_image(
    file: UploadFile,
    storage: FromDishka[StorageService],
    _: str = Depends(require_admin),
):
    """Загрузить изображение в S3-хранилище (RustFS)"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Недопустимый тип файла: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, detail="Файл слишком большой (макс. 5 МБ)")

    url = await storage.upload(data, file.filename or "image.png", file.content_type)
    return {"url": url}
