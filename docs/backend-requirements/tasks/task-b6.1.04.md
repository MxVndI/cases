# TASK-B6.1.04

**Название:** Настроить Dockerfile для user AMQP worker  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.1: Docker и контейнеризация](../user-stories/b-us-6.1.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Создать Dockerfile для user AMQP worker.

## Детали реализации

- COPY user/ .
- CMD: python worker.py

## Критерии приёмки

1. Worker запускается и подписывается на stream
