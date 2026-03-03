# TASK-B6.1.01

**Название:** Настроить Dockerfile для auth API  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.1: Docker и контейнеризация](../user-stories/b-us-6.1.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Создать Dockerfile для контейнеризации auth API сервиса.

## Детали реализации

- Base image: python:3.12-slim
- Установить зависимости из pyproject.toml
- COPY auth/ .
- CMD: uvicorn api:app --host 0.0.0.0 --port 8000

## Критерии приёмки

1. Образ собирается
2. Сервис запускается в контейнере
3. Health check проходит
