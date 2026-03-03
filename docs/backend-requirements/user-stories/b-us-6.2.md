# B-US-6.2: Traefik и API Gateway

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу настроить Traefik как единую точку входа для всех API-сервисов.

## Описание

Traefik проксирует запросы: /api/auth → auth:8000, /api/user → user:8000. Настраивается strip prefix, CORS, health checks.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.2.01](../tasks/task-b6.2.01.md) | Настроить Traefik (traefik.yml) |
| [TASK-B6.2.02](../tasks/task-b6.2.02.md) | Настроить маршрут /api/auth → auth service |
| [TASK-B6.2.03](../tasks/task-b6.2.03.md) | Настроить маршрут /api/user → user service |
| [TASK-B6.2.04](../tasks/task-b6.2.04.md) | Настроить CORS middleware |
