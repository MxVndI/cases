# TASK-B2.3.01

**Название:** Реализовать Redis Stream subscriber для user.rpc  
**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**User Story:** [B-US-2.3: Межсервисная коммуникация (User RPC)](../user-stories/b-us-2.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Григоренко

## Описание

Создать FastStream subscriber для обработки RPC-запросов от Auth Service через Redis Stream user.rpc.

## Детали реализации

- RedisRouter subscriber на StreamSub("user.rpc")
- Инжектировать UserService через Dishka
- Логировать входящие/исходящие сообщения
- Возвращать JSON через json.dumps

## Критерии приёмки

1. Subscriber запускается при старте worker
2. Сообщения обрабатываются и логируются
