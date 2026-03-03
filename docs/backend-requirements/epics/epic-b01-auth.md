# Epic B1: Аутентификация и авторизация

**Описание:** Микросервис аутентификации обеспечивает входы пользователей через OAuth-провайдеры (Discord, Яндекс) и по email с кодом подтверждения. Сессии хранятся в MongoDB с кешированием в Redis. Подписанные cookie (HMAC-SHA256) используются для идентификации. Межсервисная валидация сессий осуществляется через Redis Streams (RPC).

**Роли:** Гость, Пользователь  
**Связанные маршруты:** /api/auth/*

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-1.1 | OAuth авторизация (Discord, Яндекс) | [b-us-1.1.md](../user-stories/b-us-1.1.md) |
| B-US-1.2 | Авторизация по email (код подтверждения) | [b-us-1.2.md](../user-stories/b-us-1.2.md) |
| B-US-1.3 | Управление сессиями | [b-us-1.3.md](../user-stories/b-us-1.3.md) |
| B-US-1.4 | Межсервисная валидация сессий | [b-us-1.4.md](../user-stories/b-us-1.4.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-1.1 | Авторизация через OAuth | [b-uc-1.1.md](../use-cases/b-uc-1.1.md) |
| B-UC-1.2 | Авторизация по email | [b-uc-1.2.md](../use-cases/b-uc-1.2.md) |
| B-UC-1.3 | Валидация сессии через RPC | [b-uc-1.3.md](../use-cases/b-uc-1.3.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B1.1.01 | Настроить OAuth провайдеры (Discord, Яндекс) через fastapi-sso | B-US-1.1 |
| TASK-B1.1.02 | Реализовать эндпоинт GET /{provider}/login | B-US-1.1 |
| TASK-B1.1.03 | Реализовать callback-эндпоинт GET /auth/{provider}/callback | B-US-1.1 |
| TASK-B1.1.04 | Создать сессию после успешного OAuth | B-US-1.1 |
| TASK-B1.1.05 | Установить подписанный cookie (sid) | B-US-1.1 |
| TASK-B1.2.01 | Реализовать эндпоинт POST /email/login/start | B-US-1.2 |
| TASK-B1.2.02 | Генерировать код верификации и сохранять в Redis | B-US-1.2 |
| TASK-B1.2.03 | Отправлять код на email через SMTP (MailSender) | B-US-1.2 |
| TASK-B1.2.04 | Реализовать эндпоинт POST /email/login/finish | B-US-1.2 |
| TASK-B1.2.05 | Валидировать код из cookie (cvid) с Redis | B-US-1.2 |
| TASK-B1.3.01 | Реализовать модель Session (Beanie Document) | B-US-1.3 |
| TASK-B1.3.02 | Реализовать SessionRepo с кешированием в Redis | B-US-1.3 |
| TASK-B1.3.03 | Реализовать SessionService | B-US-1.3 |
| TASK-B1.3.04 | Реализовать подпись сессии (HMAC-SHA256) | B-US-1.3 |
| TASK-B1.3.05 | Реализовать верификацию подписанной сессии | B-US-1.3 |
| TASK-B1.4.01 | Реализовать Redis Stream subscriber для auth.rpc | B-US-1.4 |
| TASK-B1.4.02 | Обрабатывать RPC-запросы на валидацию sid | B-US-1.4 |
| TASK-B1.4.03 | Возвращать данные сессии через Redis Streams | B-US-1.4 |
