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
    token: str = ""
    allowed_tokens: list[str] = []

    # S3 / RustFS
    s3_endpoint: str = "http://rustfs-server:9000"
    s3_access_key: str = "rustfsadmin"
    s3_secret_key: str = "rustfsadmin"
    s3_bucket: str = "casehub"
    s3_public_url: str = "http://localhost:9000"


settings = Settings()
