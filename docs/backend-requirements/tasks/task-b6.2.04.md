# TASK-B6.2.04

**Название:** Настроить CORS middleware  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.2: Traefik и API Gateway](../user-stories/b-us-6.2.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Настроить CORS в Traefik для поддержки запросов с фронтенда.

## Детали реализации

- Allow origins: localhost:5173, localhost:3000
- Allow credentials: true
- Allow methods: GET, POST, PUT, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization

## Критерии приёмки

1. CORS headers возвращаются
2. Credentials поддерживаются
3. Preflight OPTIONS работает
