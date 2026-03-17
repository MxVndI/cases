# CaseHub — План доработок

> Актуализировано: 2026-03-16
> Статус: **в работе — Фазы 1–5 завершены. Текущий приоритет: UI polish → Keycloak → Kafka**

---

## Принятые решения

| Вопрос | Решение |
|--------|---------|
| Валюта | Только CaseHubCoin (убрать EUR/RUB/USD из Payment enum) |
| Google OAuth | Уже закомментирован на фронте — ничего делать не надо |
| Email-код | Временный auth до Keycloak. Работает, не трогаем |
| Auth (будущее) | **Keycloak** — пароль + 2FA email + Discord/Yandex OAuth + SSO для инфраструктуры |
| Redis | Кэш + сессии + rate limiting. Pub/Sub для SSE ленты (блок 14), потом Kafka (блок 17) |
| Межсервисная связь | HTTP (через Traefik). После Keycloak — JWT вместо verify_user |
| Картинки | Загружаем свои через админку → RustFS (S3-совместимый) |
| Admin auth | Email-код + role=admin. После Keycloak — SSO |
| Analytics | Kafka topics → отдельный аналитический сервис → ClickHouse/Grafana |
| Race condition кейсов | Не фиксим — юзер вправе открывать одновременно |
| Тесты | После стабилизации UI (блок 19.5) |
| trade_link | Выпилен ✅ |
| Блок 13 (пароль+OAuth вручную) | **Отменён** — Keycloak заменяет полностью |

---

## Блок 1 — Auth: багфиксы и стабилизация ✅

> **Все задачи блока выполнены.**
> Email-код авторизация работает end-to-end. Баги исправлены, конфигурация вынесена в env.
> Пароль, мульти-провайдер, OAuth-улучшения — всё перенесено в блок 13 (последний этап).

### 1.1 ✅ Исправить сломанные методы в SessionService
- **Где:** `backend/auth/services/session.py`
- **Сделано:** Переписаны `update_session_user_info()`, `update_session()`, `delete_session()` — используют `self.repo.redis` и `self.repo.prefix`

### 1.2 ✅ Документировать SMTP-конфиг
- **Где:** `backend/auth/.env.example`
- **Сделано:** Добавлены `SMTP_PORT`, `SMTP_SERVER`, `EMAIL_ADDRESS`, `EMAIL_PASSWORD`

### 1.3 ✅ Убрать хардкод localhost
- **Где:** `backend/auth/services/auth.py`, `backend/auth/settings.py`
- **Сделано:** Добавлены `frontend_url`, `cookie_domain`, `cookie_secure` в Settings. Redirect и cookie domain читаются из env

### 1.4 ✅ Включить secure cookies
- **Где:** `backend/auth/services/auth.py`, `backend/auth/settings.py`
- **Сделано:** `secure=self.settings.cookie_secure` (default False для dev)

### 1.5 ✅ Исправить тайпо в модели сессии
- **Где:** `backend/auth/models/session.py`, `repos/session.py`, `services/session.py`
- **Сделано:** `exipres_at` → `expires_at` во всех файлах

### 1.6 ✅ Исправить RPC-вызов к User-сервису
- **Где:** `backend/auth/services/auth.py`
- **Сделано:** Заменён `broker.request()` на aiohttp HTTP POST к `{user_service_url}/v1/users/`. Добавлен `user_service_url` в Settings

### 1.7 ✅ Исправить тайпо `mail_serive`
- **Где:** `backend/auth/services/auth.py`
- **Сделано:** `mail_serive` → `mail_service` в конструкторе и использованиях

### 1.8 ✅ Админская аутентификация через email-код
- **Где:** `backend/admin/`
- **Сделано:**
  - Удалён `LocalAuth`, `AdminLogin`, `AdminAuthResponse`, `local_auth.py`
  - Создан `AdminAuth` (`services/auth.py`) — верификация sid → auth service → user service → проверка role=="admin"
  - Создан `require_admin` dependency (`routes/deps.py`)
  - Все эндпоинты (cases, items, users) защищены `Depends(require_admin)`
  - `POST /auth/login` → `GET /auth/me`
  - Добавлено `role: str = Field(default="user")` в User model
  - Добавлен `GET /v1/users/{user_id}` в user service (с Bearer token auth)
  - `settings.secret/login/password` удалены, сервисы используют `settings.token`

---

## Блок 2 — Cases + Payment интеграция

### 2.1 ✅ Транзакция при открытии кейса
- **Где:** `backend/cases/services/case.py` → метод `open()`
- **Сделано:** `open()` переписан: баланс-проверка → weighted random выбор предмета → `POST /transaction/{user_id}` (user→system, SYSTEM_UUID) → добавление в инвентарь. Создан `PaymentService` (`services/payment.py`), зарегистрирован в DI (`ioc.py`)

### 2.2 ✅ Проверка баланса перед открытием
- **Где:** `backend/cases/services/case.py` → метод `open()`
- **Сделано:** `PaymentService.get_balance(user_id)` вызывается перед открытием. Если баланс < case.price → `ValueError` → 402 Payment Required. Добавлен `payment_service_url` в settings

### 2.3 ✅ Валидация `sum(drop_chance) == 1.0`
- **Где:** `backend/cases/services/case.py`
- **Сделано:** Добавлен `_validate_drop_chances()` — проверяет `sum == 1.0` (допуск ±0.001) в `create()` и `update()`. Routes возвращают 422 при нарушении

### 2.4 ✅ Продажа предмета из инвентаря
- **Где:** `backend/cases/routes/inventory.py` (NEW), `backend/cases/services/inventory.py`
- **Сделано:**
  - Добавлен `remove_item(user_id, item_id)` в `InventoryService`
  - Создан `routes/inventory.py` с `GET /inventory/` и `POST /inventory/sell/{item_id}`
  - Логика продажи: удаление из инвентаря → payment transaction (system→user) → rollback при ошибке
  - Router зарегистрирован в `routes/__init__.py`

### 2.5 ✅ Единая валюта CaseHubCoin
- **Где:** `backend/payment/src/shared/schemas.rs`, `db/models.rs`, `api/tap.rs`
- **Сделано:** Currency enum заменён на единственное значение `CHC`. Обновлены cur_name, balance lookup, tap endpoint

### 2.6 ✅ Drop chance: автоматическая установка (бэкенд)
- **Где:** `backend/cases/services/case.py`, `backend/cases/routes/case.py`, `backend/admin/`
- **Сделано:**
  - `POST /cases/calculate_chances` — принимает `item_ids`, возвращает рассчитанные шансы по формуле обратной стоимости
  - Добавлены `CalculateChancesRequest` схемы в cases и admin
  - Прокси эндпоинт в admin service
- **Примечание:** Фронт-часть (UI для админки) — в задаче 3.8

---

## Блок 3 — Frontend ↔ Backend интеграция

### 3.1 ✅ Убрать MOCK_MODE
- **Где:** `frontend/src/services/api.ts`
- **Сделано:** `MOCK_MODE = false`, все mock-функции удалены. `VITE_API_BASE_URL` настроен на Traefik gateway

### 3.2 ✅ API кейсов
- **Где:** `frontend/src/services/api.ts`, `frontend/src/pages/Welcome.tsx`, `frontend/src/pages/CaseDetail.tsx`
- **Сделано:** `casesApi` (getAll, getById, open, getRecentWins). Welcome.tsx → useQuery. CaseDetail.tsx → async openCase/openMultiCase с API, ошибки 402, loading/not-found

### 3.3 ✅ API баланса
- **Где:** `frontend/src/services/api.ts`, `frontend/src/components/Navbar.tsx`, `frontend/src/pages/Balance.tsx`
- **Сделано:** `paymentApi` (getBalance, getTransactions, tap). Navbar → useQuery(['balance']). Balance.tsx → реальные транзакции и статистика

### 3.4 ✅ API инвентаря
- **Где:** `frontend/src/services/api.ts`, `frontend/src/pages/Profile.tsx`
- **Сделано:** `inventoryApi` (getMyInventory, sellItem). Profile.tsx → 3 useQuery (inventory, cases, itemMap), EnrichedInventoryItem, async handleSell с инвалидацией кэша

### 3.5 ✅ API юзера
- **Где:** `frontend/src/services/api.ts`
- **Сделано:** `authApi.updateProfile()` → `PATCH /user/v1/users/me`. AuthContext → `authApi.getMe()` возвращает реальные данные

### 3.6 ✅ API фарма
- **Где:** `frontend/src/pages/Farm.tsx`
- **Сделано:** `mockAuth` заменён на `paymentApi.tap()` с батчингом (1500ms debounce). `scheduleTap()` накапливает, `flushTap()` отправляет + инвалидация баланса. Апгрейды — только localStorage

### 3.7 ✅ Админка: реальные API-вызовы
- **Где:** `frontend/src/pages/Admin.tsx`, `frontend/src/services/api.ts`
- **Сделано:** Все dummy-данные удалены. 3 useQuery (users, cases, items). Все CRUD-операции через adminApi + queryClient.invalidateQueries. ItemTreePicker получает предметы из API. CaseForm адаптирован под AdminCaseResponse (case_content с drop_chance). Auto calculateChances при создании/редактировании кейса

### 3.8 ✅ Админка: drop_chance UI
- **Где:** `frontend/src/pages/Admin.tsx`
- **Сделано:**
  - `CaseFormState` расширен полем `dropChances: Map<string, number>`
  - В модалке создания/редактирования кейса — список выбранных предметов с полями ввода drop_chance (0–1)
  - Кнопка «Авто-расчёт» → `adminApi.calculateChances()` — заполняет шансы по формуле обратной стоимости
  - Визуальный индикатор суммы (зелёный если ≈1.0, красный если нет)
  - Кнопка сохранения заблокирована если сумма !== 1.0
  - `handleAddCase`/`handleEditCase` используют dropChances напрямую

---

## Блок 4 — Админка: управление юзерами

### 4.1 ✅ Блокировка/разблокировка
- **Где:** `backend/admin/services/user.py`, `backend/admin/routes/user.py`, `backend/user/`
- **Сделано:**
  - User-сервис: `PATCH /v1/users/{user_id}/status` с Bearer token auth (`_verify_service_token`)
  - User-сервис: `update_status(user_id, new_status)` в UserService
  - Admin: `block_user()` / `unblock_user()` → proxy к user-сервису
  - Admin routes: `POST /{user_id}/block`, `POST /{user_id}/unblock` (require_admin)

### 4.2 ✅ Список юзеров с фильтрами
- **Где:** `backend/admin/routes/user.py`, `backend/user/routes/api/v1/user.py`
- **Сделано:**
  - User-сервис: `GET /v1/users/` с query params `search`, `status`, `role`, `page`, `limit` + Bearer token auth
  - User-сервис: `get_users()` в UserService с MongoDB-фильтрацией и пагинацией
  - Admin: `get_users()` proxy + `GET /` route (require_admin)
  - Исправлен DI баг в `ioc.py` (redis_broker → RedisManager)

---

## Блок 5 — Traefik + Docker

### 5.1 ✅ Маршруты и конфиг
- **Где:** `traefik/dynamic/services.yml`, `docker-compose.yml`
- **Сделано:**
  - Добавлены роутеры: `/api/cases/*` → casesservice:8000, `/api/admin/*` → adminservice:8012, `/api/payment/*` → paymentservice:8000
  - CORS middleware применён ко всем роутерам, добавлен PATCH в методы, Cookie в заголовки
  - Добавлены casesservice, adminservice, paymentservice в docker-compose.yml с настройкой env
  - Traefik depends_on обновлён, /health добавлен в payment service

---

## Блок 6 — Лента последних выигрышей

### 6.1 ✅ Запись в Redis при открытии
- **Где:** `backend/cases/services/case.py` → метод `open()`
- **Сделано:** После успешного открытия — `LPUSH recent_wins` с JSON (user_id, item_name, item_rarity, item_price, case_name, timestamp) + `LTRIM 0 49`. Redis добавлен в DI (ioc.py), передан в CaseService

### 6.2 ✅ Эндпоинт `GET /cases/recent_wins`
- **Где:** `backend/cases/routes/case.py`
- **Сделано:** `GET /cases/recent_wins?limit=20` — публичный эндпоинт, `LRANGE recent_wins 0 limit-1` из Redis, возвращает JSON-массив. limit: 1–50, default 20

### 6.3 ✅ Фронт: реальная лента
- **Где:** `frontend/src/pages/Welcome.tsx`
- **Сделано:** `dummyRecentWins` заменён на `casesApi.getRecentWins()` через useQuery. Если пуст — секция скрывается

---

## Блок 7 — Чистка и профиль

### 7.1 ✅ Удалить trade_link
- **Сделано:** Удалён `trade_link` из 6 файлов: user model, user schema, auth schema, api.json, frontend types, frontend api.ts

### 7.2 ✅ Эндпоинт `PATCH /users/me`
- **Где:** `backend/user/routes/api/v1/user.py`
- **Сделано:** `PATCH /me` принимает `{nickname?, email?}` через `UpdateMeRequest`. Авторизация через sid cookie → auth verify. `update_user(user_id, **fields)` в UserService

---

## Блок 8 — Farm (tap-to-earn)

### 8.1 ✅ Лимиты на tap (антибот)
- **Где:** `backend/payment/src/api/tap.rs`
- **Сделано:**
  - Rate limit: 10 req/sec на user_id через Redis `INCR tap:{user_id}` + `EXPIRE 1`
  - Превышение → 429 Too Many Requests
  - Максимальный amount за tap: 100 CHC, проверка amount > 0
  - Добавлен redis crate в Cargo.toml, Redis в AppState
  - Добавлен REDIS_URL в docker-compose для payment

### 8.2 ✅ Фронт: вызов POST /tap
- **Где:** `frontend/src/pages/Farm.tsx`
- **Сделано:** Батчинг (1500ms debounce) через `scheduleTap()`/`flushTap()`. Оптимистичный UI — анимация сразу. `paymentApi.tap()` + инвалидация ['balance']. Cleanup на unmount

---

## Блок 9 — RustFS (картинки)

### 9.1 ✅ Подключение RustFS
- **Где:** `backend/admin/`, `frontend/src/pages/Admin.tsx`, `frontend/src/services/api.ts`, `docker-compose.yml`
- **Сделано:**
  - Создан `StorageService` (`backend/admin/services/storage.py`) — boto3 S3 клиент с auto-create bucket, upload с UUID-ключами в `images/` prefix
  - Создан `POST /upload/image` эндпоинт (`backend/admin/routes/upload.py`) — валидация типа (png/jpeg/webp/gif), лимит 5MB, require_admin
  - Добавлены S3 настройки в `settings.py` (s3_endpoint, s3_access_key, s3_secret_key, s3_bucket, s3_public_url)
  - `StorageService` зарегистрирован в DI (`ioc.py`, Scope.APP)
  - Upload router подключен в `routes/__init__.py`
  - S3 env vars добавлены в `docker-compose.yml` (adminservice)
  - `adminApi.uploadImage()` добавлен в `api.ts` — FormData → multipart/form-data
  - В Admin.tsx: UI загрузки картинки в форме кейса — превью, кнопка загрузки (с loading), кнопка удаления
  - `img_url` передаётся в CreateCasePayload / UpdateCasePayload

---

## Блок 10 — Keycloak (высокий приоритет — Фаза 7)

> **Статус:** запланировано. Реализуем после UI-фазы. Заменяет блок 13 целиком.

### Текущее состояние
Свой auth-сервис на FastAPI:
- Сессии в MongoDB + Redis-кэш
- HMAC-SHA256 подпись cookie `sid`
- OAuth через библиотеку `fastapi-sso` (Discord, Yandex)
- Email-код: 6-значный код → Redis (TTL 10 мин) → SMTP → верификация → авто-создание юзера
- Верификация через `GET /verify_user/{sid}` — **4 зависимых сервиса**: user, cases, payment (Rust), admin

### Что даёт Keycloak
- Единая точка аутентификации (SSO) с полной поддержкой OIDC/OAuth2
- Встроенные провайдеры (Discord, Yandex, Google, GitHub и т.д.)
- Управление ролями, 2FA, password recovery, account linking — из коробки
- Админ-консоль с GUI для управления юзерами/ролями
- JWT-токены вместо session cookies — стандарт индустрии

### Сложность интеграции: **8/10 (высокая)**
- **4 сервиса** делают HTTP-вызов к `/verify_user/{sid}` — все надо переводить на JWT-валидацию
- **Rust** (Payment) — нужна библиотека для JWKS-валидации (jsonwebtoken crate)
- **Python** сервисы — замена cookie-сессий на Bearer JWT
- Замена `fastapi-sso` на OIDC redirect через Keycloak
- Миграция существующих пользователей из MongoDB в Keycloak

### План интеграции

#### 10.1 Подготовка: external_id в User model
- **Где:** `backend/user/models/user.py`
- **Что:** Добавить `external_id: str | None = None` — UUID от Keycloak при миграции юзеров

#### 10.2 Docker: запуск Keycloak
- **Где:** `docker-compose.yml`
- **Что:** Добавить `quay.io/keycloak/keycloak:latest`, порт 8090, postgres или встроенный H2 для dev
- Realm `casehub`, clients: `casehub-frontend`, `grafana`, `kibana`, `admin-panel`

#### 10.3 Auth flow: замена cookie-сессий на JWT
- **Где:** все Python-сервисы (`auth`, `user`, `cases`, `admin`)
- **Что:** Вместо `GET /verify_user/{sid}` — валидация Bearer JWT через JWKS endpoint Keycloak
- Абстрагировать верификацию в единый middleware/dependency

#### 10.4 Payment (Rust): JWKS-валидация
- **Где:** `backend/payment/src/`
- **Что:** Добавить `jsonwebtoken` crate, скачивать JWKS с Keycloak, кэшировать публичный ключ, валидировать JWT в tap/bonus

#### 10.5 OAuth-провайдеры в Keycloak
- **Что:** Discord и Yandex настраиваются как Identity Providers в Keycloak GUI
- Убрать `fastapi-sso` из auth service

#### 10.6 2FA: Email OTP
- **Что:** Authentication Flow в Keycloak: пароль → OTP на email (встроенный механизм)

#### 10.7 SSO для инфраструктуры
- **Что:** Grafana → `[auth.generic_oauth]` → Keycloak. Kibana → OIDC → Keycloak. RustFS → OIDC → Keycloak
- Один логин для всей инфраструктуры, роли из Keycloak

#### 10.8 Миграция юзеров
- **Что:** Скрипт: читает Users из MongoDB → создаёт аккаунты в Keycloak через Admin REST API → записывает `external_id` обратно в MongoDB

---

## Блок 11 — ELK-стек (анализ, низкий приоритет)

> **Статус:** анализ. Не реализуем сейчас.

### Текущее состояние логирования
| Сервис | Логирование | Формат |
|--------|------------|--------|
| Auth | Python `logging` | Текст (stdout) |
| User | Python `logging` | Текст (stdout) |
| Cases | Нет настройки | Текст (stdout) |
| Admin | `loguru` + файл `logs/app.log` | JSON (prod) / цветной текст (dev) |
| Payment (Rust) | `eprintln!()` | Текст (stderr) |

### Что нужно для ELK (Elasticsearch + Logstash + Kibana)

**Шаг 1: Стандартизация логов (средняя сложность)**
- Все Python-сервисы: единый формат JSON-логов (loguru или structlog)
- Rust: добавить `tracing` crate с JSON-форматтером
- Каждая запись: `{timestamp, level, service, message, trace_id?, ...}`

**Шаг 2: Сбор логов (низкая сложность)**
- Добавить Filebeat или Fluentd как sidecar/отдельный контейнер
- Читает docker logs (или файлы)
- Отправляет в Logstash → Elasticsearch

**Шаг 3: Docker Compose (низкая сложность)**
```
elasticsearch:  (порт 9200, ~2GB RAM)
kibana:         (порт 5601)
logstash:       (порт 5044, pipeline config)
filebeat:       (sidecar, docker socket)
```

### Сложность: **5/10 (средняя)**

---

## Блок 12 — Grafana + Prometheus (анализ, низкий приоритет)

> **Статус:** анализ. Не реализуем сейчас.

### Текущее состояние метрик
- **Нет метрик вообще** — ни в одном сервисе
- Health check: только в Traefik → `GET /health`
- Нет Prometheus-эндпоинтов, нет экспортёров

### Что нужно для Grafana + Prometheus

**Шаг 1: Инструментирование сервисов (средняя сложность)**
- Python: `prometheus-client` + `PrometheusMiddleware` для FastAPI → `/metrics`
- Rust: `prometheus` crate + axum middleware → `/metrics`
- Метрики: request_count, request_duration, error_rate, active_connections

**Шаг 2: Экспортёры инфраструктуры (низкая сложность)**
- `mongodb-exporter`, `redis-exporter`, `cAdvisor`

**Шаг 3: Docker Compose (низкая сложность)**
```
prometheus, grafana, mongodb-exporter, redis-exporter, cadvisor
```

### Сложность: **7/10 (высокая)**

---

## Блок 13 — Auth: пароль + мульти-провайдер ~~(последний этап)~~

> **Статус:** ⛔ ОТМЕНЁН — заменяется Keycloak (блок 10).
> Keycloak предоставляет пароль, 2FA, OAuth, SSO из коробки без ручной реализации.

### 13.1 Поля `password_hash` и провайдеры в модели User
- **Где:** `backend/user/models/user.py`
- **Что:**
  - Добавить `password_hash: str | None = None`
  - Добавить `discord_id: str | None = None`
  - Добавить `yandex_id: str | None = None`
  - Добавить `auth_methods: list[str] = []` (например: `["email_code", "email_password", "discord", "yandex"]`)

### 13.2 Хеширование паролей
- **Где:** `backend/auth/services/auth.py`
- **Что:** bcrypt: `hash_password(plain) → hash`, `verify_password(plain, hash) → bool`
- **Библиотека:** `bcrypt` (добавить в `pyproject.toml`)

### 13.3 Эндпоинт `POST /register` (email + password)
- **Где:** `backend/auth/routes/api.py`
- **Что:** Принимает `{email, nickname, password}`. Хеширует пароль, создаёт юзера, ставит cookie `sid`

### 13.4 Эндпоинт `POST /login` (email + password)
- **Где:** `backend/auth/routes/api.py`
- **Что:** Принимает `{email, password}`. Проверяет hash, создаёт сессию, ставит cookie `sid`

### 13.5 Расширить `POST /users/` в User-сервисе
- **Где:** `backend/user/routes/api/v1/user.py`
- **Что:** Принимать `{email, password_hash, nickname, role?}` вместо только `{email}`

### 13.6 Мульти-провайдер (привязка OAuth к существующим юзерам)
- **Где:** `backend/auth/services/auth.py`, `backend/user/services/user.py`
- **Что:**
  1. При OAuth: искать юзера по `discord_id`/`yandex_id`, потом по email
  2. Если найден по email, но провайдер не привязан — привязать
  3. Фронт: кнопки «Привязать Discord/Yandex» в настройках профиля

### 13.7 Фронт: формы email+пароль
- **Где:** `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`
- **Что:** Формы login/register вызывают `POST /auth/login`, `POST /auth/register`

### 13.8 Добавить password в `PATCH /users/me`
- **Где:** `backend/user/routes/api/v1/user.py`
- **Что:** Расширить 7.2 — принимать `{password?}`, хешировать перед сохранением

---

## Порядок реализации

```
Фаза 1: Фундамент ✅ ЗАВЕРШЕНА
Фаза 2: Cases + Admin ✅ ЗАВЕРШЕНА
Фаза 3: Инфраструктура ✅ ЗАВЕРШЕНА
Фаза 4: Frontend интеграция ✅ ЗАВЕРШЕНА
Фаза 5: Файловое хранилище (RustFS) ✅ ЗАВЕРШЕНА

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Фаза 6: UI — польш и QA  ◄── ТЕКУЩИЙ ПРИОРИТЕТ
  20.* Проверка всех страниц, баги, недостающие элементы
  15.1 Защитить Payment API (Bearer token) — сделать до Keycloak
  15.2 CORS wildcard убрать
  15.3 Rate limiting в Traefik

Фаза 7: Keycloak
  10.1 external_id в User model
  10.2 Docker: запуск Keycloak
  10.3 Auth: замена verify_user на JWT
  10.4 Payment (Rust): JWKS-валидация
  10.5 OAuth: Discord + Yandex через Keycloak
  10.6 2FA: Email OTP
  10.7 SSO: Grafana + Kibana + RustFS
  10.8 Миграция юзеров MongoDB → Keycloak

Фаза 8: Kafka — лента открытий
  17.1 Kafka topic cases.wins
  14.* SSE лента: сначала Redis Pub/Sub, потом Kafka consumer
  Kafka Docker: KRaft mode (без Zookeeper)

Фаза 9: Kafka — аналитика
  17.2 Topics: user.events, payment.transactions, cases.opened
  Producers: декораторы/middleware в каждом сервисе

Фаза 10: Аналитический сервис
  Отдельный Python/Rust consumer — читает Kafka
  Агрегация → ClickHouse или TimescaleDB
  Grafana дашборды поверх ClickHouse
  Метрики: revenue, DAU, популярность кейсов, fraud

Фаза 11: Надёжность
  16.1 Единое логирование (structlog + tracing)
  16.2 Trace ID (X-Request-ID через Traefik)
  16.3 Circuit breaker (tenacity)
  16.4 Health checks с деталями
  (16.5 Кэш verify_user — не нужен после Keycloak)

Фаза 12: Новый функционал (по приоритету)
  18.4 История открытий пользователя
  18.2 Рейтинг (leaderboard)
  18.3 Промокоды
  18.1 Достижения
  18.7 Daily/Weekly задания
  18.6 Реферальная система
  18.8 Уведомления (in-app)

Фаза 13: Наблюдаемость
  11.* ELK-стек
  12.* Grafana + Prometheus + exporters

Фаза 14: Технический долг
  19.1 Shared auth-client (упрощается после Keycloak)
  19.2 Раздельные pyproject.toml
  19.3 Удалить мёртвый код
  19.4 Типизация фронтенда (zod)
  19.5 Тесты (pytest, cargo test, vitest)
```

---

## Не делаем (отложено/отклонено/отменено)

| Задача | Причина |
|--------|---------|
| Redis Streams / RPC | Оставляем HTTP, проще и надёжнее при текущем масштабе |
| Race condition на кейсах | Юзер вправе открывать одновременно, предметы могут повторяться |
| Тесты | Запланировано (блок 19.5). Unit-тесты для payment, cases, auth |
| Google OAuth | Уже убран с фронта |
| Skip анимации | Уже реализовано на фронте, бэк отвечает синхронно |
| Блок 13 (ручной пароль+OAuth) | **Отменён** — Keycloak (блок 10, фаза 7) заменяет полностью |
| Keycloak | Анализ проведён. **Реализуем в фазе 7** |
| ELK-стек | Анализ проведён (блок 11). Реализуем после стабилизации |
| Grafana + Prometheus | Анализ проведён (блок 12). Реализуем после ELK |
| Kafka | Анализ проведён (блок 17). Не нужен при <100 юзеров |

---

## Блок 14 — Лента открытий в реальном времени (SSE + Redis Pub/Sub)

> **Статус:** запланировано
> Заменить polling (15 сек) на SSE для мгновенного обновления ленты выигрышей на главной.

### 14.1 Backend: публикация в Redis Pub/Sub
- **Где:** `backend/cases/services/case.py`
- **Что:** после `redis.lpush("recent_wins", win_entry)` добавить `redis.publish("wins_channel", win_entry)`

### 14.2 Backend: SSE endpoint
- **Где:** `backend/cases/routes/case.py`
- **Что:** новый route `GET /wins/stream` — подписка на `wins_channel`, стрим `text/event-stream` через `StreamingResponse`

### 14.3 Frontend: EventSource вместо polling
- **Где:** `frontend/src/pages/Welcome.tsx`
- **Что:** заменить `useQuery` с `refetchInterval: 15_000` на `EventSource('/api/cases/wins/stream')`, при получении события — `queryClient.setQueryData(['recentWins'], ...)`

### 14.4 Traefik: конфигурация для long-lived SSE
- **Где:** `traefik/traefik.yml` или `traefik/dynamic/services.yml`
- **Что:** настроить `transport.respondingTimeouts` для SSE-соединений

### 14.5 Fallback: polling при обрыве SSE
- **Что:** оставить polling как fallback при обрыве SSE-соединения

---

## Блок 20 — UI polish и QA (Фаза 6 — текущий приоритет)

> **Статус:** в работе. Проверяем и доделываем все страницы, убираем баги интеграции.

### 20.1 Login / Register — проверка email-code flow
- **Что:** Убедиться, что полный цикл работает: ввод email → код на почту → вход → redirect
- **Страницы:** `Login.tsx`, `Register.tsx`

### 20.2 Profile — инвентарь и продажа
- **Что:** Проверить отображение инвентаря, продажу предметов, обновление баланса
- **Страница:** `Profile.tsx`

### 20.3 CaseDetail — открытие и мультиоткрытие
- **Что:** Проверить анимацию, оптимистичное обновление баланса, обработку 402, продажу выигранного предмета
- **Страница:** `CaseDetail.tsx`

### 20.4 Balance — транзакции
- **Что:** Проверить отображение списка транзакций, форматирование дат, сортировку
- **Страница:** `Balance.tsx`

### 20.5 Farm — апгрейды и баланс
- **Что:** Проверить апгрейды (тратят реальный баланс), авто-кликер, оптимистичное обновление
- **Страница:** `Farm.tsx`

### 20.6 Welcome — лента и кейсы
- **Что:** Проверить конвейер последних выигрышей, фильтры кейсов, навигация в CaseDetail
- **Страница:** `Welcome.tsx`

### 20.7 UserProfile — публичный профиль
- **Что:** Проверить отображение публичного профиля пользователя (реальные данные)
- **Страница:** `UserProfile.tsx`

### 20.8 Admin — полный CRUD
- **Что:** Проверить создание/редактирование/удаление кейсов, предметов, раритетов; загрузку картинок; управление юзерами
- **Страница:** `Admin.tsx`

### 20.9 Daily bonus — UI кнопка
- **Что:** Кнопка «Получить ежедневный бонус» на странице Farm или Balance. Endpoint `POST /payment/bonus/daily` уже реализован в бэке (100 CHC, 24h cooldown)
- **Где:** `frontend/src/pages/Farm.tsx` или `Balance.tsx`

### 20.10 Navbar — состояния авторизации
- **Что:** Проверить: аватар/ник в navbar после логина, кнопка logout, кнопка «Админ» для role=admin, баланс

### 20.11 Error states и loading
- **Что:** Все страницы должны корректно показывать loading skeleton и error fallback при ошибках API

### 20.12 Mobile responsiveness
- **Что:** Быстрая проверка на мобильных разрешениях (375px, 768px) — навбар, кейсы, профиль, ферма

---

## Текущая архитектура (состояние на 2026-03-16)

### Схема взаимодействия

```
                          ┌──────────────┐
                          │   Frontend   │
                          │  React 19    │
                          │  Vite :5173  │
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │   Traefik    │
                          │  :80 / :8080 │
                          └──────┬───────┘
              ┌──────────┬───────┼────────┬──────────┐
              ▼          ▼       ▼        ▼          ▼
        ┌──────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌─────────┐
        │  Auth    │ │ User  │ │Cases │ │Payment│ │  Admin  │
        │ Python   │ │Python │ │Python│ │ Rust  │ │ Python  │
        │ :8000    │ │:8001  │ │:8002 │ │:8003  │ │ :8012   │
        └────┬─────┘ └───┬───┘ └──┬───┘ └───┬───┘ └────┬────┘
             │           │        │         │           │
             └───────────┴────────┴────┬────┘           │
                                       │                │
                          ┌────────────▼─────────┐      │
                          │    MongoDB 8.0       │      │
                          │  auth_db / user_db / │      │
                          │  cases_db / payment_db│     │
                          └──────────────────────┘      │
                          ┌──────────────────────┐      │
                          │     Redis 8.4        │      │
                          │ сессии / rate limit / │     │
                          │ recent_wins / daily   │     │
                          └──────────────────────┘      │
                          ┌──────────────────────┐      │
                          │    RustFS (S3)       │◄─────┘
                          │  картинки кейсов     │
                          └──────────────────────┘
```

### Стек технологий

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Frontend | React + TypeScript + TanStack Router/Query | React 19, Vite 7 |
| Auth service | FastAPI + Beanie + fastapi-sso | Python 3.13 |
| User service | FastAPI + Beanie | Python 3.13 |
| Cases service | FastAPI + Beanie | Python 3.13 |
| Admin service | FastAPI (BFF, без своей БД) | Python 3.13 |
| Payment service | Axum + mongodb crate | Rust 1.91 |
| Gateway | Traefik v3 | |
| Database | MongoDB | 8.0 |
| Cache/Sessions | Redis | 8.4 |
| Object Storage | RustFS (S3-compatible) | |
| UI Kit | shadcn/ui + Tailwind CSS 4 + Radix UI | |

### Межсервисная коммуникация

| Вызов | Протокол | Описание |
|-------|----------|---------|
| Frontend → Backend | HTTP через Traefik | Все запросы через `/api/*` |
| Cases → Auth | HTTP `GET /verify_user/{sid}` | Верификация сессии |
| Cases → Payment | HTTP `POST /transaction/{user_id}` | Списание/зачисление при открытии/продаже |
| Payment → Auth | HTTP `GET /verify_user/{sid}` | Верификация сессии (tap, daily bonus) |
| Admin → Auth + User | HTTP | 2-шаговая проверка (sid → uid → role=admin) |
| Admin → Cases | HTTP proxy | CRUD кейсов/предметов/раритетов |
| Admin → User | HTTP proxy | Список/блокировка юзеров |
| Admin → RustFS | S3 API (boto3) | Загрузка картинок |
| Auth → User | HTTP `POST /v1/users/` | Создание юзера при регистрации |

### Аутентификация

```
1. Email-код: POST /email/login/start → код на email
2. Верификация: POST /email/login/finish → создание Session в MongoDB + Redis
3. Cookie: sid = shortUUID(session_id).HMAC-SHA256(secret_key)
4. Межсервисная верификация: GET /verify_user/{sid}?token= → {uid}
   ↳ Вызывают: Cases, Payment (Rust), Admin, User (/me)
```

### Плюсы текущей архитектуры

1. **Чёткое разделение домейнов** — каждый сервис отвечает за свою область (auth, users, cases, payment, admin)
2. **Полиглотность** — Rust для Payment (высокая производительность для финансовых операций), Python для бизнес-логики
3. **Admin как BFF** — тонкий прокси без своей БД, не дублирует логику
4. **Единая точка входа** — Traefik обеспечивает маршрутизацию, CORS, health checks
5. **Простота деплоя** — один docker-compose, все сервисы стартуют вместе
6. **Beanie ODM** — удобная работа с MongoDB в Python, встроенная миграция
7. **Optimistic UI** — баланс обновляется мгновенно через queryClient.setQueryData
8. **Файловое хранилище** — S3-совместимый RustFS, легко мигрировать на AWS S3/Yandex Object Storage

### Минусы и проблемы

1. **Синхронная цепочка verify_user** — каждый запрос с авторизацией = доп. HTTP вызов к auth service. При росте нагрузки auth становится бутылочным горлышком (N запросов × 4 сервиса = 4N вызовов к auth)
2. **Нет circuit breaker** — если auth service падает, все сервисы встают. Нет fallback, нет retry-логики
3. **HTTP для межсервисного общения** — простота ценой латентности. Каждый open case = 3 HTTP вызова (verify + check balance + create transaction)
4. **Единая MongoDB** — все сервисы используют один инстанс MongoDB (разные БД, но один сервер). Single point of failure
5. **Единый Redis** — и сессии, и rate limiting, и кэш recent_wins — всё в одном Redis. Нет изоляции
6. **Нет очередей сообщений** — все операции синхронные. Нет возможности отложенной обработки, retry, dead letter queue
7. **Нет стандартизированного логирования** — Auth/User/Cases: stdlib logging, Admin: loguru, Payment: eprintln!(). Нет trace_id, нет корреляции запросов
8. **Payment не защищён** — `POST /transaction/{user_id}` и `GET /balance/{user_id}` не требуют аутентификации. Любой может создать транзакцию или посмотреть баланс, зная UUID
9. **Нет rate limiting на уровне gateway** — rate limit только на tap endpoint. Нет защиты от DDoS на уровне Traefik
10. **CORS: wildcard origins в auth** — `allow_origins=["*"]` в auth service CORS middleware
11. **Нет graceful shutdown** — сервисы не обрабатывают SIGTERM корректно для завершения in-flight запросов
12. **Дублирование auth кода** — `AuthService` / `LocalAuth` / `SessionService` дублируются между auth, cases, user, payment (у каждого своя реализация verify)

### Где можно улучшить (без Kafka)

| Область | Улучшение | Сложность |
|---------|-----------|-----------|
| **Безопасность** | Защитить Payment endpoints — Bearer token auth как в User service | Низкая |
| **Безопасность** | Убрать `allow_origins=["*"]` в auth, использовать конкретные домены | Низкая |
| **Безопасность** | Добавить rate limiting в Traefik (middleware) | Низкая |
| **Производительность** | Кэшировать verify_user в Redis на 30 сек (снизить нагрузку на auth) | Средняя |
| **Надёжность** | Circuit breaker для межсервисных вызовов (tenacity/pybreaker) | Средняя |
| **Логирование** | Единый JSON-формат + trace_id во всех сервисах | Средняя |
| **Auth** | JWT-токены вместо session cookies (убрать цепочку verify_user) | Высокая |
| **Инфраструктура** | Отдельные Redis для сессий и кэша | Низкая |

---

## Блок 15 — Безопасность и hardening

> **Статус:** запланировано. Приоритет: **высокий**

### 15.1 Защитить Payment API
- **Где:** `backend/payment/src/api/transaction.rs`, `balance.rs`
- **Что:** `POST /transaction/{user_id}` и `GET /balance/{user_id}` должны требовать Bearer token (как User service). Только inter-service вызовы с валидным TOKEN
- **Риск:** Сейчас любой может создать транзакцию или посмотреть баланс по UUID

### 15.2 CORS: убрать wildcard
- **Где:** `backend/auth/api.py`
- **Что:** Заменить `allow_origins=["*"]` на список конкретных доменов из env (`FRONTEND_URL`)

### 15.3 Rate limiting на Traefik
- **Где:** `traefik/dynamic/services.yml`
- **Что:** Добавить `rateLimit` middleware (100 req/s на IP) для всех роутеров

### 15.4 Валидация входных данных в Payment
- **Где:** `backend/payment/src/api/`
- **Что:** `GET /balance/{user_id}` — валидировать UUID формат. `POST /transaction` — проверка что amount > 0, currency валидна

### 15.5 HTTPS в продакшен
- **Где:** `traefik/traefik.yml`
- **Что:** Добавить entrypoint `websecure:443`, Let's Encrypt ACME, redirect HTTP→HTTPS

---

## Блок 16 — Надёжность и observability

> **Статус:** запланировано. Приоритет: **средний**

### 16.1 Единое логирование (structlog)
- **Где:** все Python сервисы
- **Что:** Заменить stdlib logging / loguru на `structlog` с JSON-форматом. Каждая запись: `{timestamp, level, service, message, trace_id, user_id}`
- **Rust:** Добавить `tracing` + `tracing-subscriber` с JSON-форматтером

### 16.2 Trace ID (request correlation)
- **Где:** все сервисы
- **Что:** Генерировать `X-Request-ID` в Traefik, пробрасывать через все межсервисные вызовы. Логировать в каждом сервисе

### 16.3 Circuit breaker
- **Где:** `backend/cases/services/payment.py`, `backend/cases/services/auth.py`, `backend/admin/services/`
- **Что:** Обернуть HTTP вызовы в circuit breaker (библиотека `pybreaker` или `tenacity` с retry + backoff). Если auth недоступен 5 раз подряд → открыть circuit на 30с

### 16.4 Health checks с деталями
- **Где:** все сервисы
- **Что:** `GET /health` возвращает `{status, mongodb: ok/fail, redis: ok/fail, uptime}` вместо пустого 200

### 16.5 Кэширование verify_user
- **Где:** `backend/cases/services/auth.py`, аналогично в payment
- **Что:** После успешного verify_user — кэшировать `sid → uid` в Redis на 30 секунд. При следующем запросе — читать из кэша. Снизит нагрузку на auth в 10-50x

---

## Блок 17 — Kafka: событийная архитектура

> **Статус:** анализ. Приоритет: **низкий (на вырост)**
> Kafka имеет смысл при масштабировании и для задач, где нужна гарантированная доставка, ordering, replay.

### Где Kafka реально полезен в CaseHub

#### 17.1 Лента открытий (замена Redis Pub/Sub)
- **Сейчас:** Redis `LPUSH recent_wins` + polling / планируется Pub/Sub + SSE
- **С Kafka:** `cases.wins` topic → consumer в cases service стримит через SSE. Kafka Streams позволит агрегировать (топ-предметы за час, самые дорогие выигрыши), replay при перезапуске, multiple consumers
- **Плюс:** гарантия доставки, персистентность, replay
- **Минус:** overhead для 1–10 событий/мин. Redis Pub/Sub достаточен на текущем масштабе

#### 17.2 Аналитика и события
- **Topic `user.events`:** регистрация, логин, logout, смена ника → аналитика, воронки
- **Topic `payment.transactions`:** все транзакции → аналитика дохода, fraud detection
- **Topic `cases.opened`:** открытия кейсов → статистика, ML-модели для балансировки шансов
- **Consumer:** Отдельный аналитический сервис читает все топики, агрегирует в ClickHouse/TimescaleDB
- **Плюс:** полная история событий, можно восстановить состояние, Event Sourcing
- **Минус:** значительный инфраструктурный overhead

#### 17.3 Notifications
- **Topic `notifications`:** уведомления юзерам (выигрыш редкого предмета, daily bonus напоминание)
- **Consumer:** notification-service → email/push/in-app
- **Плюс:** асинхронная отправка, retry, DLQ
- **Минус:** можно реализовать проще через Redis Pub/Sub или даже cron

#### 17.4 Saga: открытие кейса (transactional outbox)
- **Сейчас:** Cases service делает 3 синхронных HTTP вызова (verify → pay → inventory). Если на шаге 3 ошибка — деньги списаны, предмет не выдан
- **С Kafka:** Choreography saga через events: `CaseOpenRequested` → `PaymentDebited` → `InventoryItemAdded` → `CaseOpenCompleted`. Каждый шаг — отдельный consumer с компенсацией
- **Плюс:** eventual consistency, автоматические компенсации (refund при ошибке)
- **Минус:** огромная сложность для текущего масштаба. Нужен outbox pattern, idempotency keys

### Рекомендация по Kafka

```
┌─────────────────────────────────────────────────────────────────┐
│ Масштаб         │ Рекомендация                                  │
├─────────────────┼───────────────────────────────────────────────┤
│ < 100 юзеров    │ НЕ нужен. Redis Pub/Sub + HTTP достаточно    │
│ 100–1000 юзеров │ Можно для аналитики (17.2) и ленты (17.1)    │
│ 1000+ юзеров    │ Рекомендуется для ленты + аналитики + saga   │
│ 10000+ юзеров   │ Обязателен. + Event Sourcing, CQRS           │
└─────────────────┴───────────────────────────────────────────────┘
```

**Минимальный вариант внедрения Kafka:**
- Docker: `confluentinc/cp-kafka` + `cp-zookeeper` (или KRaft mode без Zookeeper)
- 1 topic: `cases.wins` → заменит Redis Pub/Sub для SSE-ленты
- 1 topic: `payment.transactions` → для будущей аналитики
- ~512MB RAM overhead

---

## Блок 18 — Новый функционал

> **Статус:** идеи. Можно реализовать на текущей архитектуре.

### 18.1 Достижения (achievements)
- **Что:** Система достижений за активность: "Открыл 10 кейсов", "Получил Legendary предмет", "Заработал 10000 CHC на ферме"
- **Где:** Новая коллекция `achievements` в cases_db или отдельный сервис
- **Фронт:** Секция в профиле, toast-уведомления при получении

### 18.2 Рейтинг (leaderboard)
- **Что:** Таблица лидеров — по балансу, по кол-ву открытий, по суммарной стоимости инвентаря
- **Где:** Redis Sorted Set (`ZADD leaderboard:{type} score user_id`)
- **Фронт:** Новая страница `/leaderboard`
- **Обновление:** При каждой транзакции / открытии кейса

### 18.3 Промокоды
- **Что:** Промокоды на бонусные CHC или бесплатное открытие кейса
- **Где:** Payment service — новая коллекция `promocodes` + endpoint `POST /promo/redeem`
- **Поля:** `code`, `type` (balance/free_open), `amount`, `max_uses`, `used_count`, `expires_at`

### 18.4 История открытий пользователя
- **Что:** Персональная история всех открытий кейсов (не только recent_wins)
- **Где:** Cases service — новая коллекция `case_opens` с полями `user_id`, `case_id`, `item_id`, `price_paid`, `opened_at`
- **Фронт:** Секция "История" в профиле

### 18.5 Upgrade кейсы (case battles)
- **Что:** Комбинация N дешёвых предметов → шанс получить 1 дорогой
- **Где:** Cases service — новый endpoint `POST /upgrade`
- **Логика:** Сумма цен предметов × коэффициент → шанс на выигрыш

### 18.6 Реферальная система
- **Что:** Реферальные ссылки, бонус рефереру при регистрации реферала
- **Где:** User service (`referral_code`, `referred_by` в User model) + Payment (бонус)
- **Фронт:** Секция "Пригласи друга" в профиле

### 18.7 Daily/Weekly задания
- **Что:** "Открой 5 кейсов сегодня", "Заработай 1000 CHC на ферме" → награда
- **Где:** Новый сервис или модуль в cases — задания в MongoDB, прогресс в Redis
- **Обновление:** При каждом действии (открытие, таппинг) проверять прогресс

### 18.8 Уведомления (in-app)
- **Что:** Колокольчик в навбаре — новые достижения, промо, daily bonus напоминание
- **Где:** Отдельный notification-сервис или модуль в user service
- **Хранение:** MongoDB коллекция `notifications` + WebSocket/SSE для real-time

---

## Блок 19 — Технический долг

> **Статус:** запланировано. Приоритет: **средний**

### 19.1 Убрать дублирование auth-кода
- **Что:** `AuthService` / `verify_user` / сессионная логика дублируется в auth, cases, user, payment
- **Решение:** Shared Python-пакет `casehub-auth-client` (pip install) с единым `verify_session(sid, auth_url, token)`. Для Rust — единый модуль `auth_client`

### 19.2 Единый pyproject.toml
- **Сейчас:** Один общий `pyproject.toml` для всех Python-сервисов, но каждый использует подмножество зависимостей
- **Проблема:** Лишние зависимости в каждом образе (boto3 в auth, robyn в cases и т.д.)
- **Решение:** Отдельные `pyproject.toml` / `requirements.txt` для каждого сервиса. Или multi-stage build с фильтрацией

### 19.3 Удалить мёртвый код
- **`backend/auth/routes/broker.py`** — Redis stream subscriber, но broker нигде не используется
- **`backend/user/routes/broker/`** — аналогично, FastStream broker для RPC, но вызовы идут по HTTP
- **`backend/user/services/mail.py`** — MailSender в user service, не используется
- **`backend/cases/services/local_auth.py`** — дублирует логику, можно объединить с auth.py
- **`frontend/src/data/dummy-data.ts`** — dummy данные, MOCK_MODE = false

### 19.4 Типизация фронтенда
- **Что:** Добавить строгие типы для API-ответов, убрать `any`, использовать zod для runtime-валидации
- **Где:** `frontend/src/services/api.ts`, `frontend/src/types/`

### 19.5 Тесты
- **Что:** Unit-тесты для критических путей: open case flow, payment transactions, auth verification
- **Где:** `pytest` для Python, `cargo test` для Rust, `vitest` для фронтенда
- **Приоритет:** Payment (деньги) → Cases (открытие) → Auth (безопасность)

---

## Обновлённый порядок реализации

```
Фаза 1–5: ЗАВЕРШЕНЫ ✅

Фаза 6: Безопасность (высокий приоритет)
  15.1 Защитить Payment API (Bearer token)
  15.2 CORS: убрать wildcard в auth
  15.3 Rate limiting в Traefik
  15.4 Валидация входных данных в Payment
  15.5 HTTPS (для продакшена)

Фаза 7: Real-time фичи
  14.* SSE лента открытий (Redis Pub/Sub)

Фаза 8: Надёжность
  16.1 Единое логирование (structlog + tracing)
  16.2 Trace ID
  16.3 Circuit breaker
  16.4 Health checks с деталями
  16.5 Кэширование verify_user

Фаза 9: Новый функционал (по приоритету)
  18.4 История открытий
  18.2 Рейтинг (leaderboard)
  18.3 Промокоды
  18.1 Достижения
  18.7 Daily задания
  18.6 Реферальная система
  18.8 Уведомления

Фаза 10: Технический долг
  19.1 Shared auth-client
  19.2 Раздельные pyproject.toml
  19.3 Удалить мёртвый код
  19.4 Типизация фронтенда
  19.5 Тесты

Фаза 11: Наблюдаемость
  11.* ELK-стек
  12.* Grafana + Prometheus

Фаза 12: Auth расширение (последний этап)
  13.* Пароль + мульти-провайдер

Фаза 13: Масштабирование (при необходимости)
  17.* Kafka (аналитика, лента, saga)
  10.* Keycloak
```
