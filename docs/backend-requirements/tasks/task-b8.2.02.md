# TASK-B8.2.02

**Название:** Реализовать эндпоинты управления маппингами (`POST /internal/access/mappings`)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.2: Управление целевыми системами и маппингами](../user-stories/b-us-8.2.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать внутренний эндпоинт для создания `Mapping` (admin_id → target_id + credentials_id).

## Детали реализации

- `POST /internal/access/mappings`:
  - Body: `{admin_id: UUID, target_id: UUID, credentials_id: UUID}`
  - Проверяет существование и активность `TargetSystem` → 404 если нет/disabled
  - Создаёт `Mapping` в `aml_db`
  - Возвращает `{id: UUID}`
- Защищён `require_internal_token`

## Критерии приёмки

1. Создание маппинга для несуществующего target → 404
2. Создание маппинга для disabled target → 404
3. Корректный запрос создаёт Mapping, возвращает UUID
4. После создания маппинга администратор видит соответствующий таргет в `GET /aml/targets`
