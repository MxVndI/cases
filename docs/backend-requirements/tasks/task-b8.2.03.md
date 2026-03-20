# TASK-B8.2.03

**Название:** Реализовать список таргетов для администратора (`GET /aml/targets`)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.2: Управление целевыми системами и маппингами](../user-stories/b-us-8.2.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `routes/access.py` — JSON-эндпоинт для получения активных таргетов текущего администратора.

## Детали реализации

- `GET /aml/targets` → `list[TargetOut]`
- Аутентификация: sid-cookie → `AuthAdapter.get_admin_id_by_sid` → `AuditService.emit("login_seen")`
- Запрос активных маппингов (`disabled=False`) для `admin_id`
- Получение `TargetSystem` по `target_ids` (только `disabled=False`)
- Response: `[{id, type, name, disabled}]`
- Пустой список, если маппингов нет

## Критерии приёмки

1. Без sid-cookie → 401
2. Администратор без маппингов → `[]`
3. Администратор с маппингами → список активных TargetOut
4. Disabled таргеты не включаются в ответ
