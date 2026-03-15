import logging
import sys

from loguru import logger
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "admin"
    app_version: str = "0.1"
    log_level: str = "DEBUG"

    case_service_url: str = ""
    payment_service_url: str = ""
    user_service_url: str = ""
    auth_service_url: str = ""
    env_type: str = "dev"
    secret: str = ""
    login: str = ""
    password: str = ""
    token: str = ""
    allowed_tokens: list[str] = []


settings = Settings()


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


def setup_logging():
    """
    Настраивает логгер для всего приложения в зависимости от окружения.
    """

    logger.remove()

    dev_format = (
        "<green>{time:HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
    )

    prod_format = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function} | {message}"

    if settings.env_type == "dev":
        logger.add(sys.stderr, level="DEBUG", format=dev_format, colorize=True)
        logger.info("Режим разработки: логирование настроено для вывода в консоль.")

    else:
        logger.add(sys.stderr, level="INFO", format=prod_format, colorize=False)

        logger.add(
            "logs/app.log",
            level="DEBUG",
            rotation="10 MB",
            retention="1 month",
            serialize=True,
        )
        logger.info(
            "Режим продакшена: логирование настроено для вывода в консоль и файл."
        )
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    logger.info("Стандартный logging перехвачен и направлен в Loguru.")
