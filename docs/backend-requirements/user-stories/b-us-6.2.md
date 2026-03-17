# B-US-6.2: API Gateway (Traefik)

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу настроить Traefik v3 как единую точку входа для всех API-сервисов с path-based маршрутизацией.

## Описание

**Traefik v3** настраивается через `traefik.yml` (статическая конфигурация) и `dynamic/services.yml` (динамическая конфигурация маршрутов). Все API-запросы проксируются по path-prefix с **StripPrefix** middleware.

5 маршрутов:
- `/api/auth` → auth-api:8000
- `/api/user` → user-api:8000
- `/api/cases` → cases:8000
- `/api/admin` → admin:8012
- `/api/payment` → payment:8000

## Критерии приёмки

- Traefik v3 с конфигурацией traefik.yml и dynamic/services.yml
- /api/auth → auth-api:8000 с StripPrefix
- /api/user → user-api:8000 с StripPrefix
- /api/cases → cases:8000 с StripPrefix
- /api/admin → admin:8012 с StripPrefix
- /api/payment → payment:8000 с StripPrefix
- Все маршруты используют StripPrefix middleware

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.2.01](../tasks/task-b6.2.01.md) | Настроить Traefik v3 (traefik.yml) |
| [TASK-B6.2.02](../tasks/task-b6.2.02.md) | Настроить dynamic/services.yml с 5 маршрутами |
| [TASK-B6.2.03](../tasks/task-b6.2.03.md) | Настроить маршрут /api/auth → auth-api:8000 (StripPrefix) |
| [TASK-B6.2.04](../tasks/task-b6.2.04.md) | Настроить маршрут /api/user → user-api:8000 (StripPrefix) |
| [TASK-B6.2.05](../tasks/task-b6.2.05.md) | Настроить маршрут /api/cases → cases:8000 (StripPrefix) |
| [TASK-B6.2.06](../tasks/task-b6.2.06.md) | Настроить маршрут /api/admin → admin:8012 (StripPrefix) |
| [TASK-B6.2.07](../tasks/task-b6.2.07.md) | Настроить маршрут /api/payment → payment:8000 (StripPrefix) |
