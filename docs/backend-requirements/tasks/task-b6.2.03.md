# TASK-B6.2.03

**Название:** Настроить маршрут /api/user → user service  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.2: Traefik и API Gateway](../user-stories/b-us-6.2.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Маршрутизация /api/user на user service с strip prefix.

## Детали реализации

- Rule: PathPrefix(/api/user)
- StripPrefix: /api/user
- Service: user-api-service → http://userservice:8000

## Критерии приёмки

1. Запросы /api/user/* проксируются
2. Prefix удаляется
