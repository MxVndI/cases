# TASK-B8.2.01

**Название:** Реализовать эндпоинты управления таргетами (`POST /internal/access/targets`)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.2: Управление целевыми системами и маппингами](../user-stories/b-us-8.2.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `routes/admin_ops.py` — защищённый внутренний эндпоинт для создания `TargetSystem`.

## Детали реализации

- Роутер: `prefix="/internal/access"`, зависимость `require_internal_token` на весь роутер
- `POST /internal/access/targets`:
  - Body: `{type, name, endpoint, auth_mode, login_path}`
  - Создаёт `TargetSystem` в `aml_db`
  - Возвращает `{id: UUID}`
- `require_internal_token` проверяет `Authorization: Bearer <token>` из `settings.allowed_tokens`

## Критерии приёмки

1. Запрос без токена → 401
2. Запрос с невалидным токеном → 403
3. `POST /internal/access/targets` создаёт TargetSystem, возвращает UUID
4. Созданный TargetSystem виден через `GET /aml/targets`
