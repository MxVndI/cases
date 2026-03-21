# CaseHub — Требования к бэкенду

## О проекте

CaseHub — веб-платформа для открытия виртуальных кейсов CS2. Бэкенд реализован на микросервисной архитектуре: пять независимых сервисов (четыре на Python/FastAPI + один на Rust/Axum), взаимодействующих через HTTP (межсервисные токены) и Redis Streams (RPC). Traefik v3 используется как API Gateway с маршрутизацией и CORS. Все сервисы контейнеризованы через Docker Compose.

## Технологический стек

- **Фреймворки:** FastAPI (Python), Axum (Rust)
- **ORM/ODM:** Beanie (MongoDB ODM), mongodb-ro (Rust)
- **База данных:** MongoDB 8.0 (отдельная БД для каждого сервиса: auth_db, user_db, cases_db, payment_db)
- **Кеширование / pub-sub:** Redis 8.4
- **Межсервисная коммуникация:** Redis Streams (FastStream), HTTP с Bearer-токенами
- **DI-контейнер:** Dishka (Python-сервисы)
- **OAuth:** fastapi-sso (Discord, Яндекс)
- **Email:** SMTP (smtplib)
- **Хранилище файлов:** RustFS (S3-совместимое)
- **API Gateway:** Traefik v3
- **Контейнеризация:** Docker, Docker Compose
- **Валюта:** CaseHubCoin (CHC)

## Микросервисы

| Сервис | Описание | Язык | Внутренний порт | AMQP Stream |
|--------|----------|------|-----------------|-------------|
| **Auth Service** | Аутентификация, сессии, OAuth, email-коды, верификация для межсервисных запросов | Python / FastAPI | 8000 | auth.rpc |
| **User Service** | Управление пользователями: профили, роли, статусы, публичные профили | Python / FastAPI | 8000 | user.rpc |
| **Cases Service** | Кейсы, предметы, редкости, теги, оружие, типы оружия, инвентарь, история выигрышей, ферма (sync/claim), SSE-лента | Python / FastAPI | 8000 | — |
| **Admin Service** | BFF для админ-панели: проксирует CRUD к Cases/User/Auth, загрузка изображений в S3 | Python / FastAPI | 8012 | — |
| **Payment Service** | Баланс, транзакции, tap (кликер), ежедневный бонус | Rust / Axum | 8000 | — |

## Структура документации

### Общие разделы

- [Глоссарий](../glossary.md) — термины, роли, сущности

### Эпики

| # | Эпик | Описание | US | UC | Задачи |
|---|------|----------|----|----|--------|
| 1 | [Аутентификация и авторизация](epics/epic-b01-auth.md) | Auth Service: OAuth (Discord, Яндекс), email-код, HMAC-сессии, logout, профиль-верификация, межсервисная валидация | 5 | 4 | 23 |
| 2 | [Управление пользователями](epics/epic-b02-user.md) | User Service: CRUD пользователей, публичные профили, управление статусами, межсервисная коммуникация | 4 | 3 | 16 |
| 3 | [Управление кейсами и справочниками](epics/epic-b03-cases.md) | Cases Service: полный CRUD кейсов/предметов/редкостей/тегов/оружия/типов оружия, открытие кейсов, SSE-лента, история выигрышей | 6 | 3 | 28 |
| 4 | [Инвентарь и баланс](epics/epic-b04-inventory.md) | Инвентарь (Cases Service) + баланс/транзакции (Payment Service): просмотр, продажа, sell-all | 3 | 2 | 10 |
| 5 | [Администрирование (BFF)](epics/epic-b05-admin.md) | Admin Service: cookie-аутентификация с проверкой роли, проксирование CRUD к Cases/User, загрузка изображений | 4 | 2 | 14 |
| 6 | [Инфраструктура](epics/epic-b06-infra.md) | Docker-контейнеризация всех 5 сервисов, Traefik, MongoDB, Redis, RustFS, DI-контейнеры Dishka, Redis Streams | 4 | 1 | 20 |
| 7 | [Ферма — бэкенд](epics/epic-b07-farm.md) | Серверный фарм (sync/claim в Cases Service) + tap/daily-bonus в Payment Service | 3 | 2 | 10 |
| | **Итого** | | **29** | **17** | **121** |

### User Stories (29)

| Код | Название | Эпик |
|-----|----------|------|
| [B-US-1.1](user-stories/b-us-1.1.md) | OAuth авторизация (Discord, Яндекс) | Epic B1 |
| [B-US-1.2](user-stories/b-us-1.2.md) | Авторизация по email (код подтверждения) | Epic B1 |
| [B-US-1.3](user-stories/b-us-1.3.md) | Управление сессиями | Epic B1 |
| [B-US-1.4](user-stories/b-us-1.4.md) | Межсервисная валидация сессий | Epic B1 |
| [B-US-1.5](user-stories/b-us-1.5.md) | Верификация профиля и logout | Epic B1 |
| [B-US-2.1](user-stories/b-us-2.1.md) | Создание и получение пользователя | Epic B2 |
| [B-US-2.2](user-stories/b-us-2.2.md) | Обновление профиля пользователя | Epic B2 |
| [B-US-2.3](user-stories/b-us-2.3.md) | Межсервисная коммуникация (User RPC) | Epic B2 |
| [B-US-2.4](user-stories/b-us-2.4.md) | Публичные профили и управление статусами | Epic B2 |
| [B-US-3.1](user-stories/b-us-3.1.md) | CRUD кейсов | Epic B3 |
| [B-US-3.2](user-stories/b-us-3.2.md) | CRUD предметов | Epic B3 |
| [B-US-3.3](user-stories/b-us-3.3.md) | Открытие кейса (игровая логика) | Epic B3 |
| [B-US-3.4](user-stories/b-us-3.4.md) | Последние выигрыши и SSE-лента | Epic B3 |
| [B-US-3.5](user-stories/b-us-3.5.md) | CRUD справочников (редкости, теги, оружие, типы оружия) | Epic B3 |
| [B-US-3.6](user-stories/b-us-3.6.md) | История выигрышей пользователя | Epic B3 |
| [B-US-4.1](user-stories/b-us-4.1.md) | Управление балансом (Payment Service) | Epic B4 |
| [B-US-4.2](user-stories/b-us-4.2.md) | Управление инвентарём | Epic B4 |
| [B-US-4.3](user-stories/b-us-4.3.md) | Продажа предметов | Epic B4 |
| [B-US-5.1](user-stories/b-us-5.1.md) | Просмотр пользователей (admin) | Epic B5 |
| [B-US-5.2](user-stories/b-us-5.2.md) | Блокировка и разблокировка (admin) | Epic B5 |
| [B-US-5.3](user-stories/b-us-5.3.md) | Cookie-аутентификация администратора | Epic B5 |
| [B-US-5.4](user-stories/b-us-5.4.md) | Проксирование CRUD и загрузка файлов | Epic B5 |
| [B-US-6.1](user-stories/b-us-6.1.md) | Docker и контейнеризация | Epic B6 |
| [B-US-6.2](user-stories/b-us-6.2.md) | Traefik и API Gateway | Epic B6 |
| [B-US-6.3](user-stories/b-us-6.3.md) | Базы данных (MongoDB, Redis) | Epic B6 |
| [B-US-6.4](user-stories/b-us-6.4.md) | Межсервисная коммуникация (Redis Streams) | Epic B6 |
| [B-US-7.1](user-stories/b-us-7.1.md) | Серверная синхронизация фермы (sync/claim) | Epic B7 |
| [B-US-7.2](user-stories/b-us-7.2.md) | Tap-эндпоинт (кликер) | Epic B7 |
| [B-US-7.3](user-stories/b-us-7.3.md) | Ежедневный бонус | Epic B7 |

### Use Cases (17)

| Код | Название | Эпик |
|-----|----------|------|
| [B-UC-1.1](use-cases/b-uc-1.1.md) | Авторизация через OAuth | Epic B1 |
| [B-UC-1.2](use-cases/b-uc-1.2.md) | Авторизация по email | Epic B1 |
| [B-UC-1.3](use-cases/b-uc-1.3.md) | Валидация сессии (межсервисная) | Epic B1 |
| [B-UC-1.4](use-cases/b-uc-1.4.md) | Logout и верификация профиля | Epic B1 |
| [B-UC-2.1](use-cases/b-uc-2.1.md) | Создание пользователя при первом входе | Epic B2 |
| [B-UC-2.2](use-cases/b-uc-2.2.md) | Получение профиля через API | Epic B2 |
| [B-UC-2.3](use-cases/b-uc-2.3.md) | Публичный профиль и управление статусом | Epic B2 |
| [B-UC-3.1](use-cases/b-uc-3.1.md) | Управление кейсом (CRUD) | Epic B3 |
| [B-UC-3.2](use-cases/b-uc-3.2.md) | Открытие кейса пользователем | Epic B3 |
| [B-UC-3.3](use-cases/b-uc-3.3.md) | SSE-лента и история выигрышей | Epic B3 |
| [B-UC-4.1](use-cases/b-uc-4.1.md) | Продажа предмета из инвентаря | Epic B4 |
| [B-UC-4.2](use-cases/b-uc-4.2.md) | Получение баланса и транзакций | Epic B4 |
| [B-UC-5.1](use-cases/b-uc-5.1.md) | Управление пользователями (admin BFF) | Epic B5 |
| [B-UC-5.2](use-cases/b-uc-5.2.md) | Проксирование CRUD и загрузка изображений | Epic B5 |
| [B-UC-6.1](use-cases/b-uc-6.1.md) | Развёртывание инфраструктуры | Epic B6 |
| [B-UC-7.1](use-cases/b-uc-7.1.md) | Синхронизация прогресса фермы | Epic B7 |
| [B-UC-7.2](use-cases/b-uc-7.2.md) | Tap и ежедневный бонус | Epic B7 |

### Задачи (121)

Все задачи находятся в папке [tasks/](tasks/). Кодировка: `TASK-B{epic}.{us}.{seq}`.

## Маршруты API

### Auth Service (`/api/auth`)

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/auth/{provider}/login | GET | Инициация OAuth (Discord, Яндекс) | Все |
| /api/auth/auth/{provider}/callback | GET | Callback OAuth | Все |
| /api/auth/email/login/start | POST | Вход по email — отправка кода | Все |
| /api/auth/email/login/finish | POST | Подтверждение email-кода | Все |
| /api/auth/me | GET | Текущий пользователь (по cookie sid) | Авторизованный |
| /api/auth/logout | POST | Выход (удаление сессии и cookie) | Авторизованный |
| /api/auth/profile/update/start | POST | Запрос кода для обновления профиля | Авторизованный |
| /api/auth/profile/update/finish | POST | Подтверждение кода обновления профиля | Авторизованный |
| /api/auth/verify_user/{ssid} | GET | Межсервисная верификация сессии (token в query) | Сервис (токен) |

### User Service (`/api/user`)

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/user/v1/users/me | GET | Профиль текущего пользователя | Авторизованный (cookie) |
| /api/user/v1/users/me | PATCH | Обновить никнейм | Авторизованный (cookie) |
| /api/user/v1/users/ | GET | Список пользователей (фильтры: search, status, role, page, limit) | Сервис (токен) |
| /api/user/v1/users/public/{nickname} | GET | Публичный профиль по никнейму | Все |
| /api/user/v1/users/{user_id} | GET | Получить пользователя по ID | Сервис (токен) |
| /api/user/v1/users/{user_id}/status | PATCH | Обновить статус (block/unblock) | Сервис (токен) |
| /api/user/v1/users/ | POST | Создать пользователя | Сервис (токен) |

### Cases Service (`/api/cases`)

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/cases/cases/ | GET | Список кейсов (disabled видны admin) | Все |
| /api/cases/cases/{id} | GET | Кейс по ID | Все |
| /api/cases/cases/by-name/{name} | GET | Кейс по имени | Все |
| /api/cases/cases/by-system-name/{system_name} | GET | Кейс по system_name | Все |
| /api/cases/cases/ | POST | Создать кейс | Токен (admin) |
| /api/cases/cases/ | PATCH | Обновить кейс | Токен (admin) |
| /api/cases/cases/{id} | DELETE | Удалить кейс | Токен (admin) |
| /api/cases/cases/open/{id} | POST | Открыть кейс по ID | Авторизованный |
| /api/cases/cases/open/by-name/{name} | POST | Открыть кейс по имени | Авторизованный |
| /api/cases/cases/open/by-system-name/{system_name} | POST | Открыть кейс по system_name | Авторизованный |
| /api/cases/cases/wins/stream | GET | SSE-лента выигрышей (Server-Sent Events) | Все |
| /api/cases/cases/recent_wins | GET | Последние выигрыши из Redis | Все |
| /api/cases/cases/wins/my | GET | Мои выигрыши (история) | Авторизованный |
| /api/cases/cases/wins/my/stats | GET | Статистика моих выигрышей | Авторизованный |
| /api/cases/cases/wins/user/{user_id} | GET | Выигрыши пользователя | Все |
| /api/cases/cases/wins/user/{user_id}/stats | GET | Статистика выигрышей пользователя | Все |
| /api/cases/cases/calculate_chances | POST | Рассчитать шансы выпадения | Токен (admin) |
| /api/cases/cases/calculate_price | POST | Рассчитать цену кейса | Токен (admin) |
| /api/cases/items/ | GET | Список всех предметов | Все |
| /api/cases/items/{id} | GET | Предмет по ID | Все |
| /api/cases/items/ | POST | Создать предмет | Токен (admin) |
| /api/cases/items/ | PATCH | Обновить предмет | Токен (admin) |
| /api/cases/items/{id} | DELETE | Удалить предмет | Токен (admin) |
| /api/cases/rarities/ | GET/POST | CRUD редкостей | GET: Все / POST: Токен |
| /api/cases/rarities/{id} | GET/PATCH/DELETE | CRUD редкости по ID | GET: Все / Остальное: Токен |
| /api/cases/tags/ | GET/POST | CRUD тегов | GET: Все / POST: Токен |
| /api/cases/tags/{id} | GET/PATCH/DELETE | CRUD тега по ID | GET: Все / Остальное: Токен |
| /api/cases/weapons/ | GET/POST | CRUD оружия | GET: Все / POST: Токен |
| /api/cases/weapons/{id} | GET/PATCH/DELETE | CRUD оружия по ID | GET: Все / Остальное: Токен |
| /api/cases/weapon-types/ | GET/POST | CRUD типов оружия | GET: Все / POST: Токен |
| /api/cases/weapon-types/{id} | GET/PATCH/DELETE | CRUD типа оружия по ID | GET: Все / Остальное: Токен |
| /api/cases/inventory/ | GET | Инвентарь текущего пользователя | Авторизованный |
| /api/cases/inventory/user/{user_id} | GET | Инвентарь пользователя | Все |
| /api/cases/inventory/sell/{entry_id} | POST | Продать предмет из инвентаря | Авторизованный |
| /api/cases/inventory/sell-all | POST | Продать все предметы | Авторизованный |
| /api/cases/farm/sync | POST | Синхронизация фермы (сохранить уровни, получить offline-доход) | Авторизованный |
| /api/cases/farm/claim | POST | Собрать монеты фермы на баланс | Авторизованный |

### Admin Service (`/api/admin`)

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/admin/auth/me | GET | Проверка admin-сессии | Администратор (cookie) |
| /api/admin/cases/ | GET | Список кейсов | Администратор |
| /api/admin/cases/{case_id} | GET | Кейс по ID | Администратор |
| /api/admin/cases/ | POST | Создать кейс | Администратор |
| /api/admin/cases/ | PATCH | Обновить кейс | Администратор |
| /api/admin/cases/{case_id} | DELETE | Удалить кейс | Администратор |
| /api/admin/cases/calculate_chances | POST | Рассчитать шансы | Администратор |
| /api/admin/cases/calculate_price | POST | Рассчитать цену | Администратор |
| /api/admin/items/ | GET/POST/PATCH | CRUD предметов | Администратор |
| /api/admin/items/{item_id} | GET/DELETE | Предмет по ID | Администратор |
| /api/admin/rarities/ | GET/POST | CRUD редкостей | Администратор |
| /api/admin/rarities/{rarity_id} | GET/PATCH/DELETE | Редкость по ID | Администратор |
| /api/admin/tags/ | GET/POST | CRUD тегов | Администратор |
| /api/admin/tags/{tag_id} | GET/PATCH/DELETE | Тег по ID | Администратор |
| /api/admin/weapons/ | GET/POST | CRUD оружия | Администратор |
| /api/admin/weapons/{weapon_id} | GET/PATCH/DELETE | Оружие по ID | Администратор |
| /api/admin/weapon-types/ | GET/POST | CRUD типов оружия | Администратор |
| /api/admin/weapon-types/{weapon_type_id} | GET/PATCH/DELETE | Тип оружия по ID | Администратор |
| /api/admin/users/ | GET | Список пользователей (фильтры) | Администратор |
| /api/admin/users/ | POST | Создать пользователя | Администратор |
| /api/admin/users/{user_id}/block | POST | Заблокировать | Администратор |
| /api/admin/users/{user_id}/unblock | POST | Разблокировать | Администратор |
| /api/admin/upload/image | POST | Загрузить изображение в S3 (RustFS) | Администратор |

### Payment Service (`/api/payment`)

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/payment/balance/{user_id} | GET | Баланс пользователя (wallet.balances.CHC) | Все |
| /api/payment/transaction/{user_id} | GET | История транзакций | Все |
| /api/payment/transaction/{user_id} | POST | Создать транзакцию | Сервис |
| /api/payment/tap | POST | Tap (фарм-клики, rate limit 10/сек) | Авторизованный (cookie) |
| /api/payment/bonus/daily | POST | Ежедневный бонус (100 CHC, 24ч cooldown) | Авторизованный (cookie) |
