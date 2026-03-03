# TASK-B3.4.01

**Название:** Реализовать эндпоинт GET /cases/recently_opened  
**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**User Story:** [B-US-3.4: Последние открытия](../user-stories/b-us-3.4.md)  
**Статус:** Не начата  
**Исполнитель:** Андрей Пикулев

## Описание

Публичный эндпоинт для получения последних открытий кейсов на платформе.

## Детали реализации

- GET /cases/recently_opened
- Читать из Redis list (LRANGE 0 N)
- Вернуть: userLogin, itemName, caseName, openedAt
- Fallback на MongoDB при пустом Redis

## Критерии приёмки

1. Последние открытия возвращаются
2. Доступен без авторизации
3. Быстрый ответ из Redis
