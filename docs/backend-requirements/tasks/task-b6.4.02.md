# TASK-B6.4.02

**Название:** Реализовать паттерн request-reply (FastStream)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.4: Межсервисная коммуникация (Redis Streams)](../user-stories/b-us-6.4.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Настроить FastStream для паттерна request-reply через Redis Streams.

## Детали реализации

- broker.request(stream, message, timeout) — клиент
- router.subscriber(stream) → return response — сервер
- Timeout handling для клиента

## Критерии приёмки

1. Request отправляется и получает reply
2. Timeout обрабатывается
