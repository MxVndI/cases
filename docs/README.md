# CaseHub — Документация проекта

## Обзор

CaseHub — веб-платформа для открытия виртуальных кейсов с предметами CS2. Платформа построена на микросервисной архитектуре с 6 бэкенд-сервисами (5 на Python/FastAPI + 1 на Rust/Axum), раздельным фронтендом (React + TypeScript) и единым API-шлюзом (Traefik).

## Структура документации

| Раздел | Описание | Файлы |
|--------|----------|-------|
| [Требования к фронтенду](frontend-requirements/index.md) | Эпики, User Stories, Use Cases и задачи для фронтенда | 7 эпиков, 35 US, 16 UC, 139 задач |
| [Требования к бэкенду](backend-requirements/index.md) | Эпики, User Stories, Use Cases и задачи для бэкенда | 8 эпиков, 33 US, 20 UC, 105 задач |
| [Глоссарий](glossary.md) | Роли, сущности, термины, валюта, редкости | Общий для всех разделов |
| [Команда](team.md) | Состав команды и роли | — |

## Итоговая статистика

| Метрика | Фронтенд | Бэкенд | Итого |
|---------|----------|--------|-------|
| Эпики | 7 | 8 | 15 |
| User Stories | 35 | 33 | 68 |
| Use Cases | 16 | 20 | 36 |
| Задачи | 139 | 105 | 244 |

## Технологии

### Фронтенд
React 19, TypeScript, Vite 7, TanStack Router, TanStack Query, Axios, Tailwind CSS v4, Framer Motion, GSAP, Radix UI, Lucide React, react-icons, Sonner, input-otp

### Бэкенд
- **Python-сервисы (Auth, User, Cases, Admin, AML):** FastAPI, Beanie (MongoDB ODM), Redis, FastStream (Redis Streams via `StreamSub`), Dishka DI, fastapi-sso (OAuth), boto3 (S3), prometheus-fastapi-instrumentator, loguru, msgspec
- **Rust-сервис (Payment):** Axum, MongoDB (mongodb crate), Redis (redis crate), Tokio, reqwest, utoipa (OpenAPI + Swagger UI)

### Инфраструктура
Docker, Docker Compose (3 файла: infra, services, основной), Traefik v3, MongoDB 8.0, Redis 8.4, RustFS (S3-совместимое хранилище), Mongo Express, Redis Commander
