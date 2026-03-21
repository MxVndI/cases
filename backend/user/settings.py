from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "user_db"
    redis_url: str = "redis://localhost:6379/0"
    auth_service_url: str = "http://localhost:8000"
    app_name: str = "UserService"
    app_version: str = "0.1"
    log_level: str = "INFO"

    # Токены для межсервисного взаимодействия
    token: str = ""
    allowed_tokens: list[str] = []


settings = Settings()
