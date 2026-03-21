# TASK-B1.4.01

**Название:** Реализовать Redis Stream subscriber для auth.rpc  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.4: Межсервисная валидация сессий](../user-stories/b-us-1.4.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Создать FastStream subscriber, слушающий Redis Stream auth.rpc для обработки RPC-запросов валидации сессий.

## Детали реализации

- Использовать FastStream RedisRouter
- Subscriber на stream StreamSub("auth.rpc", maxlen=100)
- Принимать dict сообщения
- Инжектить AuthService через Dishka

## Критерии приёмки

1. Subscriber запускается при старте worker
2. Сообщения обрабатываются
3. Логирование входящих/исходящих
