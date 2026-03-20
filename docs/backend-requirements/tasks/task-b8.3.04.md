# TASK-B8.3.04

**Название:** Настроить Dishka DI-контейнер для AML Service (ioc.py)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.3: Безопасное хранение учётных данных](../user-stories/b-us-8.3.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Настроить Dishka DI-контейнер в `ioc.py` для управления зависимостями AML Service.

## Детали реализации

- `ConfigProvider(Provider)`:
  - `get_settings() -> Settings` (Scope.APP)
- `ServiceProvider(Provider)`:
  - `get_http_session() -> AsyncIterable[ClientSession]` (Scope.APP) — aiohttp `ClientSession` с `TCPConnector` (limit=200, limit_per_host=50, ttl_dns_cache=300), `ClientTimeout(total=30, connect=5, sock_read=15)`
  - `get_mongo_client(settings) -> AsyncIOMotorClient` (Scope.APP)
  - `get_mongo_db(settings, client) -> AsyncDatabase` (Scope.APP) — база `aml_db`
  - `get_redis(settings) -> AsyncIterator[Redis]` (Scope.APP) — `Redis.from_url(settings.redis_url)`
  - `get_auth_adapter(settings, ses) -> AuthAdapter` (Scope.REQUEST)
  - `get_audit_service() -> AuditService` (Scope.REQUEST)
  - `get_secret_service(settings) -> SecretService` (Scope.REQUEST)
- `make_async_container(ConfigProvider(), ServiceProvider(), FastapiProvider())`
- Интеграция с FastAPI: `setup_dishka(container, app)` в `api.py`

## Критерии приёмки

1. Все зависимости разрешаются без ошибок при старте
2. `ClientSession` создаётся один раз (Scope.APP) и переиспользуется
3. MongoDB и Redis клиенты живут на уровне приложения
4. `AuthAdapter`, `AuditService`, `SecretService` создаются per-request
5. `dishka-fastapi` интеграция работает через `DishkaRoute` в роутерах
