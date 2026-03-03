# CaseHub — Требования к бэкенду

## О проекте

CaseHub — веб-платформа для открытия виртуальных кейсов CS2. Бэкенд реализован на микросервисной архитектуре: FastAPI + Beanie (MongoDB ODM) + Redis + FastStream (Redis Streams). Межсервисное взаимодействие через Redis Streams (RPC-паттерн). Traefik используется как API Gateway.

## Технологический стек

- **Фреймворк:** FastAPI
- **ORM:** Beanie (MongoDB ODM)
- **База данных:** MongoDB 8.0
- **Кеширование:** Redis 8.4
- **Межсервисная коммуникация:** Redis Streams (FastStream)
- **DI-контейнер:** Dishka
- **OAuth:** fastapi-sso (Discord, Яндекс)
- **Email:** SMTP (smtplib)
- **API Gateway:** Traefik v3
- **Контейнеризация:** Docker, Docker Compose

## Микросервисы

| Сервис | Описание | API Port | AMQP Stream |
|--------|----------|----------|-------------|
| **Auth Service** | Аутентификация, сессии, OAuth | 8000 | auth.rpc |
| **User Service** | Управление пользователями | 8001 (→8000) | user.rpc |
| **Case Service** | Кейсы, предметы, открытие | (планируется) | — |
| **Farm Service** | Ферма (кликер) | (планируется) | — |

## Структура документации

### Общие разделы

- [Глоссарий](../glossary.md) — термины, роли, сущности

### Эпики

| # | Эпик | Описание | US | UC | Задачи |
|---|------|----------|----|----|--------|
| 1 | [Аутентификация и авторизация](epics/epic-b01-auth.md) | Микросервис аутентификации обеспечивает входы пользователей через OAuth-провайдеры (Discord, Яндекс) и по email с кодом подтверждения. | 4 | 3 | 18 |
| 2 | [Управление пользователями](epics/epic-b02-user.md) | Микросервис пользователей отвечает за хранение и управление данными пользователей: создание при первом входе, получение профиля, обновление данных. | 3 | 2 | 10 |
| 3 | [Управление кейсами](epics/epic-b03-cases.md) | Сервис управления кейсами обеспечивает полный жизненный цикл кейсов: создание, редактирование, удаление (для администраторов), получение списка кейсов и их содержимого, открытие кейса с алгоритмом случайного выпадения предметов, ведение истории открытий. | 4 | 2 | 17 |
| 4 | [Инвентарь и баланс](epics/epic-b04-inventory.md) | Управление инвентарём и балансом пользователя. | 3 | 1 | 10 |
| 5 | [Администрирование (API)](epics/epic-b05-admin.md) | API для административной панели: просмотр всех пользователей с фильтрацией, поиском и пагинацией, блокировка/разблокировка пользователей, проверка прав администратора через middleware. | 3 | 1 | 10 |
| 6 | [Инфраструктура](epics/epic-b06-infra.md) | Инфраструктурный эпик: Docker-контейнеризация всех сервисов, Traefik как API Gateway с маршрутизацией и CORS, настройка MongoDB и Redis, DI-контейнеры Dishka, межсервисная коммуникация через Redis Streams (FastStream). | 4 | 1 | 17 |
| 7 | [Ферма — бэкенд](epics/epic-b07-farm.md) | Бэкенд для мини-игры «Ферма» (кликер). | 2 | 1 | 7 |
| | **Итого** | | **23** | **11** | **89** |

### User Stories (23)

| Код | Название | Эпик |
|-----|----------|------|
| [B-US-1.1](user-stories/b-us-1.1.md) | OAuth авторизация (Discord, Яндекс) | Epic B1 |
| [B-US-1.2](user-stories/b-us-1.2.md) | Авторизация по email (код подтверждения) | Epic B1 |
| [B-US-1.3](user-stories/b-us-1.3.md) | Управление сессиями | Epic B1 |
| [B-US-1.4](user-stories/b-us-1.4.md) | Межсервисная валидация сессий | Epic B1 |
| [B-US-2.1](user-stories/b-us-2.1.md) | Создание и получение пользователя | Epic B2 |
| [B-US-2.2](user-stories/b-us-2.2.md) | Обновление профиля пользователя | Epic B2 |
| [B-US-2.3](user-stories/b-us-2.3.md) | Межсервисная коммуникация (User RPC) | Epic B2 |
| [B-US-3.1](user-stories/b-us-3.1.md) | CRUD кейсов | Epic B3 |
| [B-US-3.2](user-stories/b-us-3.2.md) | Содержимое кейса (предметы) | Epic B3 |
| [B-US-3.3](user-stories/b-us-3.3.md) | Открытие кейса (игровая логика) | Epic B3 |
| [B-US-3.4](user-stories/b-us-3.4.md) | Последние открытия | Epic B3 |
| [B-US-4.1](user-stories/b-us-4.1.md) | Управление балансом | Epic B4 |
| [B-US-4.2](user-stories/b-us-4.2.md) | Управление инвентарём | Epic B4 |
| [B-US-4.3](user-stories/b-us-4.3.md) | Продажа предметов | Epic B4 |
| [B-US-5.1](user-stories/b-us-5.1.md) | Просмотр пользователей (admin) | Epic B5 |
| [B-US-5.2](user-stories/b-us-5.2.md) | Блокировка и разблокировка (admin) | Epic B5 |
| [B-US-5.3](user-stories/b-us-5.3.md) | Проверка прав администратора | Epic B5 |
| [B-US-6.1](user-stories/b-us-6.1.md) | Docker и контейнеризация | Epic B6 |
| [B-US-6.2](user-stories/b-us-6.2.md) | Traefik и API Gateway | Epic B6 |
| [B-US-6.3](user-stories/b-us-6.3.md) | Базы данных (MongoDB, Redis) | Epic B6 |
| [B-US-6.4](user-stories/b-us-6.4.md) | Межсервисная коммуникация (Redis Streams) | Epic B6 |
| [B-US-7.1](user-stories/b-us-7.1.md) | Сохранение и загрузка прогресса фермы | Epic B7 |
| [B-US-7.2](user-stories/b-us-7.2.md) | Начисление монет на баланс | Epic B7 |

### Use Cases (11)

| Код | Название | Эпик |
|-----|----------|------|
| [B-UC-1.1](use-cases/b-uc-1.1.md) | Авторизация через OAuth | Epic B1 |
| [B-UC-1.2](use-cases/b-uc-1.2.md) | Авторизация по email | Epic B1 |
| [B-UC-1.3](use-cases/b-uc-1.3.md) | Валидация сессии через RPC | Epic B1 |
| [B-UC-2.1](use-cases/b-uc-2.1.md) | Создание пользователя при первом входе | Epic B2 |
| [B-UC-2.2](use-cases/b-uc-2.2.md) | Получение профиля через API | Epic B2 |
| [B-UC-3.1](use-cases/b-uc-3.1.md) | Создание кейса администратором | Epic B3 |
| [B-UC-3.2](use-cases/b-uc-3.2.md) | Открытие кейса пользователем | Epic B3 |
| [B-UC-4.1](use-cases/b-uc-4.1.md) | Продажа предмета из инвентаря | Epic B4 |
| [B-UC-5.1](use-cases/b-uc-5.1.md) | Управление пользователями (admin) | Epic B5 |
| [B-UC-6.1](use-cases/b-uc-6.1.md) | Развёртывание инфраструктуры | Epic B6 |
| [B-UC-7.1](use-cases/b-uc-7.1.md) | Синхронизация прогресса фермы | Epic B7 |

### Задачи (89)

Все задачи находятся в папке [tasks/](tasks/). Кодировка: `TASK-B{epic}.{us}.{seq}`.

## Маршруты API

| Маршрут | Метод | Описание | Доступ |
|---------|-------|----------|--------|
| /api/auth/{provider}/login | GET | Инициация OAuth | Все |
| /api/auth/auth/{provider}/callback | GET | Callback OAuth | Все |
| /api/auth/email/login/start | POST | Вход по email (шаг 1) | Все |
| /api/auth/email/login/finish | POST | Подтверждение кода (шаг 2) | Все |
| /api/auth/me | GET | Текущий пользователь | Авторизованный |
| /api/user/v1/users/me | GET | Профиль пользователя | Авторизованный |
| /api/user/v1/users/me | PATCH | Обновить профиль | Авторизованный |
| /cases | GET | Список кейсов | Все |
| /cases/{id}/items | GET | Предметы кейса | Все |
| /cases/{id}/open | POST | Открыть кейс | Авторизованный |
| /cases/recently_opened | GET | Последние открытия | Все |
| /cases | POST | Создать кейс | Администратор |
| /cases/{id} | PUT | Обновить кейс | Администратор |
| /cases/{id} | DELETE | Удалить кейс | Администратор |
| /user_inventory/{userId} | GET | Инвентарь | Авторизованный |
| /user_inventory/{itemId}/sell | POST | Продать предмет | Авторизованный |
| /admin/users | GET | Список пользователей | Администратор |
| /admin/users/{userId} | GET | Профиль пользователя | Администратор |
| /admin/users/{userId} | POST | Блокировка/разблокировка | Администратор |
| /farm/state | GET | Прогресс фермы | Авторизованный |
| /farm/state | POST | Сохранить прогресс | Авторизованный |
| /farm/collect | POST | Собрать монеты | Авторизованный |
