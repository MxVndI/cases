# Epic B6: Инфраструктура

**Описание:** Инфраструктурный эпик: Docker-контейнеризация всех сервисов, Traefik как API Gateway с маршрутизацией и CORS, настройка MongoDB и Redis, DI-контейнеры Dishka, межсервисная коммуникация через Redis Streams (FastStream).

**Роли:** DevOps, Разработчик  
**Связанные маршруты:** —  
**Зависимости:** —

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-6.1 | Docker и контейнеризация | [b-us-6.1.md](../user-stories/b-us-6.1.md) |
| B-US-6.2 | Traefik и API Gateway | [b-us-6.2.md](../user-stories/b-us-6.2.md) |
| B-US-6.3 | Базы данных (MongoDB, Redis) | [b-us-6.3.md](../user-stories/b-us-6.3.md) |
| B-US-6.4 | Межсервисная коммуникация (Redis Streams) | [b-us-6.4.md](../user-stories/b-us-6.4.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-6.1 | Развёртывание инфраструктуры | [b-uc-6.1.md](../use-cases/b-uc-6.1.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B6.1.01 | Настроить Dockerfile для auth API | B-US-6.1 |
| TASK-B6.1.02 | Настроить Dockerfile для auth AMQP worker | B-US-6.1 |
| TASK-B6.1.03 | Настроить Dockerfile для user API | B-US-6.1 |
| TASK-B6.1.04 | Настроить Dockerfile для user AMQP worker | B-US-6.1 |
| TASK-B6.1.05 | Настроить docker-compose.yml | B-US-6.1 |
| TASK-B6.2.01 | Настроить Traefik (traefik.yml) | B-US-6.2 |
| TASK-B6.2.02 | Настроить маршрут /api/auth → auth service | B-US-6.2 |
| TASK-B6.2.03 | Настроить маршрут /api/user → user service | B-US-6.2 |
| TASK-B6.2.04 | Настроить CORS middleware | B-US-6.2 |
| TASK-B6.3.01 | Настроить MongoDB (Beanie) для auth service | B-US-6.3 |
| TASK-B6.3.02 | Настроить MongoDB (Beanie) для user service | B-US-6.3 |
| TASK-B6.3.03 | Настроить Redis для кеширования | B-US-6.3 |
| TASK-B6.3.04 | Настроить Redis Connection Pool (RedisManager) | B-US-6.3 |
| TASK-B6.4.01 | Настроить Redis Streams для RPC | B-US-6.4 |
| TASK-B6.4.02 | Реализовать паттерн request-reply (FastStream) | B-US-6.4 |
| TASK-B6.4.03 | Настроить DI-контейнер Dishka для auth service | B-US-6.4 |
| TASK-B6.4.04 | Настроить DI-контейнер Dishka для user service | B-US-6.4 |
