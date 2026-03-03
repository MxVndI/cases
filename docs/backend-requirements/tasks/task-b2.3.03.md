# TASK-B2.3.03

**Название:** Реализовать SessionService для валидации sid через auth.rpc  
**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**User Story:** [B-US-2.3: Межсервисная коммуникация (User RPC)](../user-stories/b-us-2.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Григоренко

## Описание

В User Service реализовать SessionService, который валидирует sid через RPC к Auth Service.

## Детали реализации

- Метод get_user_id_by_sid(sid): broker.request(stream="auth.rpc", message={sid}, timeout=5)
- Парсить ответ: json.loads(data.body)
- Извлечь custom_data.user.id
- При ошибке/таймауте → None

## Критерии приёмки

1. Валидный sid → user_id
2. Невалидный sid → None
3. Таймаут → None
