# CaseHub — Документация проекта

## Обзор

CaseHub — веб-платформа для открытия виртуальных кейсов с предметами CS2. Платформа построена на микросервисной архитектуре с 5 бэкенд-сервисами (4 на Python/FastAPI + 1 на Rust/Axum), раздельным фронтендом (React + TypeScript) и единым API-шлюзом (Traefik).

## Структура документации

| Раздел | Описание | Файлы |
|--------|----------|-------|
| [Требования к фронтенду](frontend-requirements/index.md) | Эпики, User Stories, Use Cases и задачи для фронтенда | 7 эпиков, 33 US, 16 UC, ~140 задач |
| [Требования к бэкенду](backend-requirements/index.md) | Эпики, User Stories, Use Cases и задачи для бэкенда | 7 эпиков, 29 US, 17 UC, ~121 задач |
| [Глоссарий](glossary.md) | Роли, сущности, термины, валюта, редкости | Общий для всех разделов |
| [Команда](team.md) | Состав команды и роли | — |

## Итоговая статистика

| Метрика | Фронтенд | Бэкенд | Итого |
|---------|----------|--------|-------|
| Эпики | 7 | 7 | 14 |
| User Stories | 33 | 29 | 62 |
| Use Cases | 16 | 17 | 33 |
| Задачи | ~140 | ~121 | ~261 |

## Технологии

### Фронтенд
React 18, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Tailwind CSS v4, Framer Motion, GSAP, shadcn/ui, Lucide React, Sonner

### Бэкенд
- **Python-сервисы (Auth, User, Cases, Admin):** FastAPI, Beanie (MongoDB ODM), Redis, FastStream (Redis Streams), Dishka DI, fastapi-sso (OAuth), aiosmtplib
- **Rust-сервис (Payment):** Axum, MongoDB (mongodb crate), Redis (redis crate), Tokio

### Инфраструктура
Docker, Docker Compose (3 файла: infra, services, frontend), Traefik v3, MongoDB 8.0, Redis 8.4, RustFS (S3-совместимое хранилище)
