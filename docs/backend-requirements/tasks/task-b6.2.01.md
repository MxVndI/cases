# TASK-B6.2.01

**Название:** Настроить Traefik (traefik.yml)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.2: Traefik и API Gateway](../user-stories/b-us-6.2.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Создать конфигурацию Traefik: entrypoints, providers, dashboard.

## Детали реализации

- EntryPoint web: :80
- Docker provider + file provider
- Dashboard: insecure=true (dev)
- Log level: INFO

## Критерии приёмки

1. Traefik запускается
2. Dashboard доступен на :8080
