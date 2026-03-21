# B-US-6.4: Dependency Injection (Dishka)

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** Разработчик

## User Story

Как разработчик, я хочу использовать Dependency Injection для управления зависимостями во всех Python-сервисах.

## Описание

**Dishka** используется как DI-фреймворк в Auth, User, Cases и Admin сервисах. Интеграция с FastAPI через **dishka-fastapi**. Каждый сервис имеет `ioc.py` с настройкой провайдеров.

Dishka предоставляет:
- MongoDB client (AsyncIOMotorClient)
- Redis client (aioredis)
- Service-классы (AuthService, SessionService, UserService, CaseService и др.)
- Settings (Pydantic BaseSettings)

**AsyncContainer** с request scope обеспечивает создание зависимостей per-request.

## Критерии приёмки

- Dishka настроен в Auth, User, Cases, Admin сервисах (ioc.py)
- Провайдеры: MongoDB client, Redis client, service-классы, settings
- AsyncContainer с request scope
- Интеграция с FastAPI через dishka-fastapi
- Каждый сервис имеет отдельный ioc.py

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.4.01](../tasks/task-b6.4.01.md) | Настроить Dishka DI-контейнер для Auth Service (ioc.py) |
| [TASK-B6.4.02](../tasks/task-b6.4.02.md) | Настроить Dishka DI-контейнер для User Service (ioc.py) |
| [TASK-B6.4.03](../tasks/task-b6.4.03.md) | Настроить Dishka DI-контейнер для Cases Service (ioc.py) |
| [TASK-B6.4.04](../tasks/task-b6.4.04.md) | Настроить Dishka DI-контейнер для Admin Service (ioc.py) |
| [TASK-B6.4.05](../tasks/task-b6.4.05.md) | Настроить провайдеры: MongoDB, Redis, Settings, Service-классы |
| [TASK-B6.4.06](../tasks/task-b6.4.06.md) | Интегрировать Dishka с FastAPI через dishka-fastapi (AsyncContainer, request scope) |
