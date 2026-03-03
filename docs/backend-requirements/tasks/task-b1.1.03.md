# TASK-B1.1.03

**Название:** Реализовать callback-эндпоинт GET /auth/{provider}/callback  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.1: OAuth авторизация (Discord, Яндекс)](../user-stories/b-us-1.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Обработать возврат пользователя после авторизации у OAuth-провайдера: верифицировать данные, получить email.

## Детали реализации

- Создать роут GET /auth/{provider}/callback
- Вызвать sso.verify_and_process(request)
- Получить объект пользователя с email и provider
- При ошибке — перенаправить на /auth-error
- Вызвать register_user(email, provider)

## Критерии приёмки

1. Callback обрабатывается корректно
2. Email пользователя извлекается из ответа провайдера
3. Ошибки обрабатываются gracefully
