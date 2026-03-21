# TASK-B6.1.05

**Название:** Настроить docker-compose.yml  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.1: Docker и контейнеризация](../user-stories/b-us-6.1.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Настроить Docker Compose для оркестрации всех сервисов: auth, user, Redis, MongoDB, Traefik, admin tools.

## Детали реализации

- Сервисы: traefik, redis, mongodb, authservice, authconsumer, userservice, userconsumer, mongo-express, redis-commander
- Volumes для persistent data
- Сеть backend (bridge)
- Health checks для MongoDB
- depends_on для порядка запуска

## Критерии приёмки

1. Все сервисы запускаются через docker-compose up
2. Зависимости порядка запуска соблюдены
3. Данные персистентны
