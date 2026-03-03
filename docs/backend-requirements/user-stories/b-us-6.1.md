# B-US-6.1: Docker и контейнеризация

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу контейнеризировать все микросервисы для единообразного развёртывания.

## Описание

Dockerfile для каждого сервиса (API + AMQP worker). Docker Compose для оркестрации всех сервисов, баз данных и инфраструктурных компонентов.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.1.01](../tasks/task-b6.1.01.md) | Настроить Dockerfile для auth API |
| [TASK-B6.1.02](../tasks/task-b6.1.02.md) | Настроить Dockerfile для auth AMQP worker |
| [TASK-B6.1.03](../tasks/task-b6.1.03.md) | Настроить Dockerfile для user API |
| [TASK-B6.1.04](../tasks/task-b6.1.04.md) | Настроить Dockerfile для user AMQP worker |
| [TASK-B6.1.05](../tasks/task-b6.1.05.md) | Настроить docker-compose.yml |
