# TASK-B8.3.02

**Название:** Реализовать эндпоинты создания и расшифровки учётных данных (`/internal/secret/*`)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.3: Безопасное хранение учётных данных](../user-stories/b-us-8.3.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `routes/secret.py` — внутренние эндпоинты для управления зашифрованными учётными данными.

## Детали реализации

- Роутер: `prefix="/internal/secret"`, все эндпоинты защищены `require_internal_token`
- `POST /internal/secret/credentials`:
  - Body: `{username, password}`
  - Вызывает `envelope_encrypt(settings, username, password)` → `CryptoConfigError` → 500
  - Создаёт `EncryptedBlob(**to_b64_fields(env))` в `aml_db`
  - Возвращает `{id: UUID}`
- `POST /internal/secret/decrypt`:
  - Body: `{admin_id: UUID, target_id: UUID}`
  - Проверяет наличие активного Mapping для `(admin_id, target_id)` → 404 если нет
  - Загружает `EncryptedBlob` по `mapping.credentials_id` → 404 если нет/disabled
  - Вызывает `envelope_decrypt(settings, **from_b64_fields(fields))` → 500 при ошибке
  - Возвращает `{username, password}`

## Критерии приёмки

1. Без токена → 401; невалидный токен → 403
2. `POST /internal/secret/credentials` создаёт EncryptedBlob, возвращает UUID
3. `POST /internal/secret/decrypt` при корректном маппинге возвращает plaintext
4. Без маппинга → 404; при сбое расшифровки → 500
5. Plaintext не логируется и не хранится
