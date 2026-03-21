# TASK-B6.4.03

**Название:** Настроить DI-контейнер Dishka для auth service  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.4: Межсервисная коммуникация (Redis Streams)](../user-stories/b-us-6.4.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Настроить IoC-контейнер Dishka для инъекции зависимостей в auth service.

## Детали реализации

- Providers: ConfigProvider, ServiceProvider, SSOProvider
- Scopes: APP (singleton) и REQUEST (per-request)
- setup_dishka(container, app) для FastAPI
- setup_dishka(container, app) для FastStream

## Критерии приёмки

1. DI работает для API и worker
2. Все зависимости резолвятся
