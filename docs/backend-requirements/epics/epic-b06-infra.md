# Epic B6: Инфраструктура

**Описание:** Docker-контейнеризация всех 5 микросервисов (Auth API + AMQP, User API + AMQP, Cases, Admin, Payment) и фронтенда. Traefik v3 как API Gateway с path-based маршрутизацией, strip-prefix middleware и CORS. MongoDB 8.0 (общий инстанс, отдельные БД для каждого сервиса: auth_db, user_db, cases_db, payment_db). Redis 8.4 для кеширования, pub/sub, rate limiting. RustFS как S3-совместимое хранилище для изображений. DI-контейнеры Dishka для Python-сервисов. Вспомогательные контейнеры: mongo-express (UI), redis-commander (UI). Три docker-compose файла: infra (MongoDB, Redis, Traefik, RustFS), services (микросервисы), основной (фронтенд). Стек мониторинга: Prometheus (сбор метрик), Loki (агрегация логов), Promtail (агент Docker SD), Grafana (визуализация, provisioning datasources + dashboard).

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
| B-US-6.5 | Мониторинг и сбор логов (Prometheus + Grafana + Loki) | [b-us-6.5.md](../user-stories/b-us-6.5.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-6.1 | Развёртывание инфраструктуры | [b-uc-6.1.md](../use-cases/b-uc-6.1.md) |
| B-UC-6.2 | Мониторинг сервисов через Grafana | [b-uc-6.2.md](../use-cases/b-uc-6.2.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B6.1.01 | Настроить Dockerfile для Auth API | B-US-6.1 |
| TASK-B6.1.02 | Настроить Dockerfile для Auth AMQP worker | B-US-6.1 |
| TASK-B6.1.03 | Настроить Dockerfile для User API | B-US-6.1 |
| TASK-B6.1.04 | Настроить Dockerfile для User AMQP worker | B-US-6.1 |
| TASK-B6.1.05 | Настроить Dockerfile для Cases Service | B-US-6.1 |
| TASK-B6.1.06 | Настроить Dockerfile для Admin Service | B-US-6.1 |
| TASK-B6.1.07 | Настроить Dockerfile для Payment Service (Rust multi-stage build) | B-US-6.1 |
| TASK-B6.1.08 | Настроить Dockerfile для Frontend (Node.js build + nginx) | B-US-6.1 |
| TASK-B6.1.09 | Настроить docker-compose-infra.yml (MongoDB, Redis, Traefik, RustFS, mongo-express, redis-commander) | B-US-6.1 |
| TASK-B6.1.10 | Настроить docker-compose-services.yml (все микросервисы) | B-US-6.1 |
| TASK-B6.1.11 | Настроить docker-compose.yml (фронтенд) | B-US-6.1 |
| TASK-B6.2.01 | Настроить Traefik (traefik.yml, entrypoints, providers) | B-US-6.2 |
| TASK-B6.2.02 | Настроить маршрут /api/auth → auth:8000 (с StripPrefix) | B-US-6.2 |
| TASK-B6.2.03 | Настроить маршрут /api/user → user:8000 (с StripPrefix) | B-US-6.2 |
| TASK-B6.2.04 | Настроить маршрут /api/cases → cases:8000 (с StripPrefix) | B-US-6.2 |
| TASK-B6.2.05 | Настроить маршрут /api/admin → admin:8012 (с StripPrefix) | B-US-6.2 |
| TASK-B6.2.06 | Настроить маршрут /api/payment → payment:8000 (с StripPrefix) | B-US-6.2 |
| TASK-B6.2.07 | Настроить CORS middleware (allowedOrigins, allowedMethods, allowedHeaders) | B-US-6.2 |
| TASK-B6.3.01 | Настроить MongoDB для всех сервисов (auth_db, user_db, cases_db, payment_db) | B-US-6.3 |
| TASK-B6.3.02 | Настроить Redis для кеширования, pub/sub и rate limiting | B-US-6.3 |
| TASK-B6.3.03 | Настроить RustFS (S3-совместимое хранилище для изображений) | B-US-6.3 |
| TASK-B6.4.01 | Настроить Redis Streams для RPC (auth.rpc, user.rpc) | B-US-6.4 |
| TASK-B6.4.02 | Реализовать паттерн request-reply (FastStream) | B-US-6.4 |
| TASK-B6.4.03 | Настроить DI-контейнер Dishka для auth service | B-US-6.4 |
| TASK-B6.4.04 | Настроить DI-контейнер Dishka для user service | B-US-6.4 |
| TASK-B6.4.05 | Настроить DI-контейнер Dishka для cases service | B-US-6.4 |
| TASK-B6.4.06 | Настроить DI-контейнер Dishka для admin service | B-US-6.4 |
| TASK-B6.5.01 | Настроить Prometheus (prometheus.yml, scrape targets, Docker volume) | B-US-6.5 |
| TASK-B6.5.02 | Настроить Loki (loki-config.yml, TSDB schema v13, retention 7 дней) | B-US-6.5 |
| TASK-B6.5.03 | Настроить Promtail (Docker SD, relabeling, pipeline stages для log-level) | B-US-6.5 |
| TASK-B6.5.04 | Настроить Grafana с provisioning datasources (Prometheus + Loki) | B-US-6.5 |
| TASK-B6.5.05 | Создать и подключить dashboard casehub-overview.json | B-US-6.5 |
