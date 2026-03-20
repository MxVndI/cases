# TASK-B8.3.03

**Название:** Настроить модели Beanie: TargetSystem, Mapping, EncryptedBlob, AuditEvent  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.3: Безопасное хранение учётных данных](../user-stories/b-us-8.3.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать все Beanie-документы AML Service и зарегистрировать их при старте приложения.

## Детали реализации

- `models/target_system.py` — `TargetSystem(Document)`: `id(UUID)`, `type(TargetType)`, `name`, `endpoint(HttpUrl)`, `auth_mode(AuthMode)`, `login_path`, `created_at`, `disabled`
- `models/mapping.py` — `Mapping(Document)`: `id(UUID)`, `admin_id(UUID)`, `target_id(UUID)`, `credentials_id(UUID)`, `created_at`, `disabled`
- `models/credentials.py` — `EncryptedBlob(Document)`: `alg="AES-256-GCM"`, `key_version=1`, 9 Base64-полей для DEK + username + password, `created_at`, `disabled`
- `models/audit_event.py` — `AuditEvent(Document)`: `id(UUID)`, `event_type(str)`, `admin_id(UUID|None)`, `target_id(UUID|None)`, `metadata(dict)`, `created_at`
- `models/admin_ref.py` — вспомогательная модель (ссылка на администратора)
- `services/database.py` — `connect_db()`: инициализация Beanie с `AsyncIOMotorClient` и всеми 4 документами для `aml_db`
- Экспорт через `models/__init__.py`: `TargetSystem`, `Mapping`, `EncryptedBlob`, `AuditEvent`, `AdminRef`

## Критерии приёмки

1. `connect_db()` вызывается при старте (`lifespan`)
2. Все 4 модели зарегистрированы в Beanie
3. CRUD-операции через модели отражаются в `aml_db`
4. `bson_encoders = {UUID: str}`, `keep_nulls = False` настроены для корректной сериализации
