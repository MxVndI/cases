# TASK-B8.1.01

**Название:** Настроить Dockerfile и docker-compose для AML Service  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.1: Проксированный доступ к управляющим UI](../user-stories/b-us-8.1.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Контейнеризировать AML Service и добавить его в `docker-compose.yml`.

## Детали реализации

- Dockerfile: `backend/aml/Dockerfile_api` (Python/FastAPI, аналог других сервисов)
- `docker-compose.yml`, сервис `amlservice`:
  - `container_name: aml.api-ch`
  - `env_file: .env`
  - `environment`: `MONGODB_DB_NAME=aml_db`, `APP_NAME=aml.api`, `LOG_LEVEL=INFO`, `AUTH_SERVICE_URL`, `FRONTEND_URL`, `MONGO_EXPRESS_USER/PASSWORD`, `REDIS_COMMANDER_HTTP_USER/PASSWORD`
  - `depends_on`: redis, mongodb, authservice
  - Не экспонируется напрямую — доступ через Traefik
  - Сеть: `casehub_backend`

## Критерии приёмки

1. Образ собирается без ошибок
2. Контейнер `aml.api-ch` стартует и отвечает на `GET /health`
3. Сервис не экспонирован на внешний порт напрямую
