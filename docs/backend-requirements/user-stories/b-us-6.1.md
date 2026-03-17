# B-US-6.1: Docker-контейнеризация

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу контейнеризировать все микросервисы и инфраструктуру для единообразного развёртывания.

## Описание

Проект использует три Docker Compose файла:

- **docker-compose-infra.yml** — инфраструктура: MongoDB 8.0, Redis 8.4, RustFS (S3-совместимое хранилище), mongo-express, redis-commander
- **docker-compose-services.yml** — бэкенд-сервисы: auth-api, user-api, cases, admin, payment
- **docker-compose.yml** — фронтенд

Каждый сервис имеет свой Dockerfile. Payment Service (Rust/Axum) использует multi-stage build. Python-сервисы основаны на FastAPI.

## Критерии приёмки

- docker-compose-infra.yml: MongoDB 8.0, Redis 8.4, RustFS, mongo-express, redis-commander
- docker-compose-services.yml: auth-api, user-api, cases, admin, payment
- docker-compose.yml: frontend
- Каждый сервис имеет собственный Dockerfile
- Payment Service (Rust) использует multi-stage build
- Все сервисы запускаются через docker compose

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.1.01](../tasks/task-b6.1.01.md) | Настроить docker-compose-infra.yml (MongoDB 8.0, Redis 8.4, RustFS, mongo-express, redis-commander) |
| [TASK-B6.1.02](../tasks/task-b6.1.02.md) | Настроить docker-compose-services.yml (auth-api, user-api, cases, admin, payment) |
| [TASK-B6.1.03](../tasks/task-b6.1.03.md) | Настроить docker-compose.yml (frontend) |
| [TASK-B6.1.04](../tasks/task-b6.1.04.md) | Создать Dockerfile для auth-api, user-api, cases, admin (Python/FastAPI) |
| [TASK-B6.1.05](../tasks/task-b6.1.05.md) | Создать Dockerfile для payment (Rust multi-stage build) |
