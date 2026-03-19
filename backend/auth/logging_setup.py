import logging
import sys
import time
import uuid

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

_SKIP_PATHS = {"/health", "/metrics"}


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _SKIP_PATHS:
            return await call_next(request)

        request_id = str(uuid.uuid4())
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        status_code = response.status_code
        log_data = dict(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query=str(request.url.query) or None,
            status_code=status_code,
            duration_ms=duration_ms,
            client_ip=request.headers.get("x-forwarded-for", request.client.host if request.client else None),
        )

        if status_code >= 500:
            logger.error("HTTP request", **log_data)
        elif status_code >= 400:
            logger.warning("HTTP request", **log_data)
        else:
            logger.info("HTTP request", **log_data)

        return response


class InterceptHandler(logging.Handler):
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging(service_name: str, log_level: str = "INFO"):
    logger.remove()

    logger.add(
        sys.stdout,
        level=log_level,
        serialize=True,
        backtrace=True,
        diagnose=False,
    )

    logger.configure(extra={"service_name": service_name})

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    for name in logging.root.manager.loggerDict:
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

    logger.info("Logging configured", service_name=service_name, log_level=log_level)
