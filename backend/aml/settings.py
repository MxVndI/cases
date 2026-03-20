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
    mongodb_db_name: str = "aml_db"
    redis_url: str = "redis://localhost:6379/0"

    auth_service_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    app_name: str = "AMLService"
    app_version: str = "0.1"
    log_level: str = "INFO"

    # Token used to call auth-service /verify_user/{sid}
    token: str = ""

    # Allowlist for internal calls into AML components (future use)
    allowed_tokens: list[str] = []

    # Master key (KEK) for envelope encryption, Base64-encoded 32 bytes.
    # MUST NOT be stored in DB.
    aml_kek_b64: str = ""

    # CSRF signing secret for AML UI/API (NOT a user password).
    csrf_secret: str = ""

    mongo_express_user: str = ""
    mongo_express_password: str = ""
    redis_commander_http_user: str = ""
    redis_commander_http_password: str = ""
    grafana_user: str = ""
    grafana_password: str = ""
    # Fixed UUID shared with GF_SERVER_ROOT_URL in docker-compose so Grafana knows its proxy path.
    # Override via GRAFANA_TARGET_ID env var if you change the docker-compose value.
    grafana_target_id: str = "f47ac10b-58cc-4372-a567-0e02b2c3d479"


settings = Settings()
