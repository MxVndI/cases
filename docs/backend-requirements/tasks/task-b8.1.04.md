# TASK-B8.1.04

**Название:** Реализовать аудит-лог (AuditEvent, AuditService)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.1: Проксированный доступ к управляющим UI](../user-stories/b-us-8.1.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать сервис аудита для фиксации всех обращений к AML в MongoDB.

## Детали реализации

- `models/audit_event.py` — Beanie Document `AuditEvent`:
  - `id: UUID`, `event_type: str`, `admin_id: UUID | None`, `target_id: UUID | None`
  - `metadata: dict`, `created_at: datetime`
- `services/audit.py` — `AuditService.emit(event_type, admin_id, target_id, metadata)`:
  - создаёт и вставляет `AuditEvent` в `aml_db`
- Типы событий: `"login_seen"` (GET /aml/targets), `"proxy_access"` (прокси-запрос)
- `AuditService` предоставляется через Dishka (Scope.REQUEST)

## Критерии приёмки

1. После каждого `GET /aml/targets` в `aml_db.AuditEvent` появляется запись `login_seen`
2. После каждого прокси-запроса появляется запись `proxy_access` с `target_id` и `path`
3. Сбой записи аудита не прерывает основной запрос
