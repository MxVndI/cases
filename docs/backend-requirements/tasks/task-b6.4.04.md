# TASK-B6.4.04

**Название:** Настроить DI-контейнер Dishka для user service  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.4: Межсервисная коммуникация (Redis Streams)](../user-stories/b-us-6.4.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Настроить IoC-контейнер Dishka для user service.

## Детали реализации

- Providers: ConfigProvider, ServiceProvider
- Резолв: UserService, SessionService, RedisService
- setup_dishka для FastAPI и FastStream

## Критерии приёмки

1. DI работает для API и worker
2. Все зависимости резолвятся
