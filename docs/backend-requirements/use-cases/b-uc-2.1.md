# B-UC-2.1: Создание пользователя при первом входе

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)

## Описание

Создание пользователя при первом входе

## Акторы

- **Первичный:** Auth Service (клиент)
- **Система:** User Service (сервер)

## Предусловия

Auth Service успешно авторизовал пользователя (OAuth или email)

## Основной сценарий

1. Auth Service отправляет RPC через Redis Stream user.rpc: {email: "...", action: "get"}
2. User Service получает запрос в subscriber handle_rpc
3. User Service вызывает get_user_by_email(email)
4. Если пользователь не найден — создаётся новый User с email и default nickname
5. User Service возвращает JSON с данными пользователя
6. Auth Service сохраняет данные в сессии (custom_data.user)

## Постусловия

Пользователь создан в MongoDB (если новый), данные сохранены в сессии

## Альтернативные сценарии

1. Ошибка MongoDB → исключение, Auth Service создаёт сессию без данных

## Связанные User Stories

- [B-US-2.1](../user-stories/b-us-2.1.md)
