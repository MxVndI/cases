from fastapi import Header, HTTPException, status

from settings import settings


def require_internal_token(authorization: str | None = Header(default=None)) -> None:
    """
    Gate for internal-only endpoints (Secret/ops).
    Uses the same allowlist token approach already present in the repo.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization.replace("Bearer ", "")
    if token not in settings.allowed_tokens:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

