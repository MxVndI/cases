# TASK-B1.1.01

**Название:** Настроить OAuth провайдеры (Discord, Яндекс) через fastapi-sso  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.1: OAuth авторизация (Discord, Яндекс)](../user-stories/b-us-1.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Настроить OAuth-провайдеры Discord и Яндекс с помощью библиотеки fastapi-sso. Зарегистрировать приложения у провайдеров, получить client_id и client_secret, настроить redirect URI.

## Детали реализации

- Создать SSOProvider в IoC-контейнере (Dishka)
- Настроить YandexSSO с client_id, client_secret и redirect_uri
- Настроить DiscordSSO с client_id, client_secret и redirect_uri
- Хранить секреты в переменных окружения (Settings)
- Сформировать словарь sso_dict для маршрутизации по провайдеру

## Критерии приёмки

1. Discord SSO инициализируется с корректными параметрами
2. Yandex SSO инициализируется с корректными параметрами
3. Секреты не захардкожены в коде
4. Redirect URI корректны для обоих провайдеров
