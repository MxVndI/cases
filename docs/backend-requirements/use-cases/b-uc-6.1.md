# B-UC-6.1: Развёртывание инфраструктуры

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)

## Описание

Развёртывание инфраструктуры

## Акторы

- **Первичный:** DevOps
- **Система:** Инфраструктура

## Предусловия

Код микросервисов готов к деплою

## Основной сценарий

1. DevOps запускает docker-compose up
2. Собираются Docker-образы для auth API, auth AMQP, user API, user AMQP
3. Запускаются Redis и MongoDB
4. Запускается Traefik с конфигурацией маршрутов
5. Auth Service подключается к MongoDB (auth_db) и Redis
6. User Service подключается к MongoDB (user_db) и Redis
7. AMQP workers подключаются к Redis Streams
8. Traefik маршрутизирует /api/auth → auth:8000, /api/user → user:8000
9. Health checks проходят для всех сервисов

## Постусловия

Все сервисы запущены и доступны через Traefik

## Альтернативные сценарии

1. MongoDB не запустилась → healthcheck fail, depends_on блокирует старт сервисов
2. Redis недоступен → RPC и кеширование не работают

## Связанные User Stories

- [B-US-6.1](../user-stories/b-us-6.1.md)
- [B-US-6.2](../user-stories/b-us-6.2.md)
- [B-US-6.3](../user-stories/b-us-6.3.md)
- [B-US-6.4](../user-stories/b-us-6.4.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-6.1](sequences.md)
