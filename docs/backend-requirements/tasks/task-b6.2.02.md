# TASK-B6.2.02

**Название:** Настроить маршрут /api/auth → auth service  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.2: Traefik и API Gateway](../user-stories/b-us-6.2.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Динамическая конфигурация: маршрутизация /api/auth на auth service с strip prefix.

## Детали реализации

- Rule: PathPrefix(/api/auth)
- StripPrefix: /api/auth
- Service: auth-api-service → http://authservice:8000
- Health check: /health

## Критерии приёмки

1. Запросы /api/auth/* проксируются
2. Prefix удаляется
