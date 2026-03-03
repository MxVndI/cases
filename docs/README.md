# CaseHub — Документация проекта

## Обзор

CaseHub — веб-платформа для открытия виртуальных кейсов с предметами CS2. Платформа построена на микросервисной архитектуре с раздельным фронтендом и бэкендом.

## Структура документации

| Раздел | Описание | Файлы |
|--------|----------|-------|
| [Требования к фронтенду](frontend-requirements/README.md) | Эпики, User Stories, Use Cases и задачи для фронтенда | 7 эпиков, 33 US, 16 UC, 140 задач |
| [Требования к бэкенду](backend-requirements/README.md) | Эпики, User Stories, Use Cases и задачи для бэкенда | 7 эпиков, 23 US, 11 UC, 89 задач |
| [Глоссарий](glossary.md) | Роли, сущности, термины, валюта, редкости | Общий для всех разделов |
| [Команда](team.md) | Состав команды и роли | — |

## Итоговая статистика

| Метрика | Фронтенд | Бэкенд | Итого |
|---------|----------|--------|-------|
| Эпики | 7 | 7 | 14 |
| User Stories | 33 | 23 | 56 |
| Use Cases | 16 | 11 | 27 |
| Задачи | 140 | 89 | 229 |

## Технологии

### Фронтенд
React, TypeScript, TanStack Router, TanStack Query, Tailwind CSS v4, Framer Motion, shadcn/ui

### Бэкенд
FastAPI, Beanie (MongoDB ODM), Redis 8.4, FastStream (Redis Streams), Dishka DI, fastapi-sso (OAuth)

### Инфраструктура
Docker, Docker Compose, Traefik v3, MongoDB 8.0, Redis 8.4
