# CaseHub — TODO

> Актуализировано: 2026-03-17
> Результат полного аудита проекта: безопасность, наблюдаемость, архитектура

---

## 1. Безопасность — CRITICAL

> Уязвимости, которые позволяют полный компромисс данных или финансов. Исправлять немедленно.

### 1.1 Payment Service — нет аутентификации на финансовых эндпоинтах
- **Где:** `backend/payment/src/api/balance.rs`, `transactions.rs`, `main.rs`
- **Что:** `POST /transaction/{user_id}`, `GET /balance/{user_id}`, `GET /transaction/{user_id}` — **нулевая** аутентификация. Порт 8003 проброшен на хост
- **Атака:** Любой может создать транзакцию, списав средства с любого юзера, или прочитать баланс/историю
- **Исправление:** Добавить Bearer token middleware (как в User service). Только inter-service вызовы с валидным TOKEN

### 1.2 MongoDB без аутентификации
- **Где:** `docker-compose.yml` — MongoDB-контейнер
- **Что:** Нет `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD`. Порт 27017 проброшен на хост. Строки подключения без credentials
- **Атака:** Кто угодно с сетевым доступом читает/пишет/удаляет все БД (auth, users, cases, payment)
- **Исправление:** Включить auth, убрать проброс порта или ограничить `127.0.0.1`

### 1.3 Redis без аутентификации
- **Где:** `docker-compose.yml` — Redis-контейнер
- **Что:** Нет пароля, порт 6379 открыт. Redis хранит сессии, верификационные коды, rate-limit ключи
- **Атака:** Чтение сессий (hijack любого юзера), чтение верификационных кодов, удаление rate-limit ключей
- **Исправление:** `--requirepass`, обновить все `REDIS_URL`, убрать проброс порта

### 1.4 Пустой SECRET_KEY по умолчанию
- **Где:** `backend/auth/settings.py` — `secret_key: str = ""`
- **Что:** Если env-переменная не задана — HMAC-подпись сессий использует пустую строку
- **Атака:** Подделка session cookie любого юзера (`hmac.new(b"", ...)`)
- **Исправление:** Убрать дефолт, валидировать при старте (минимум 32 байта entropy)

### 1.5 Нет HTTPS / TLS
- **Где:** `traefik/traefik.yml` — только HTTP entrypoint на порту 80
- **Что:** Весь трафик (cookies, токены, транзакции) идёт открытым текстом
- **Атака:** Перехват session cookies, credentials, API-токенов
- **Исправление:** Добавить `websecure:443`, TLS-сертификаты (Let's Encrypt), HTTP→HTTPS redirect

### 1.6 `cookie_secure` = False по умолчанию
- **Где:** `backend/auth/settings.py` — `cookie_secure: bool = False`
- **Что:** Session cookie `sid` отправляется по HTTP без Secure-флага
- **Исправление:** Поставить `True`, но только после настройки TLS (1.5)

### 1.7 Race condition — double-spend / отрицательный баланс
- **Где:** `backend/payment/src/db/models.rs` — `create_transaction()`
- **Что:** Проверка баланса и списание — **не атомарные**. Два параллельных запроса оба проходят проверку, оба списывают
- **Атака:** Одновременные `POST /open/{case_id}` — юзер тратит больше, чем имеет
- **Исправление:** Атомарный `findOneAndUpdate` с условием `balance >= amount`, либо MongoDB transactions

---

## 2. Безопасность — HIGH

### 2.1 CORS wildcard + credentials на всех сервисах
- **Где:** `auth/api.py`, `cases/main.py`, `admin/main.py`, `user/api.py`
- **Что:** `allow_origins=["*"]` + `allow_credentials=True` → FastAPI рефлектит любой origin
- **Атака:** Вредоносный сайт делает аутентифицированные запросы от имени жертвы
- **Исправление:** Заменить на конкретные домены из env (`FRONTEND_URL`)

### 2.2 Верификационный код не удаляется после использования
- **Где:** `backend/auth/services/auth.py` — `finish_verify_user_email()`
- **Что:** Redis-ключ `cvid:{cvid}` не удаляется — код валиден до конца TTL (10 мин)
- **Атака:** Replay-атака: повторное использование перехваченного кода
- **Исправление:** `await self.redis.delete(f"cvid:{cvid}")` после успешной верификации

### 2.3 Не-криптографический RNG для открытия кейсов
- **Где:** `backend/cases/services/case.py` — `random.choices()`
- **Что:** Mersenne Twister предсказуем, можно восстановить состояние PRNG по наблюдениям
- **Исправление:** `secrets.SystemRandom().choices()` или `random.SystemRandom()`

### 2.4 API-токены в query string и body
- **Где:** `cases/routes/case.py` (delete — `?token=`), `cases/routes/item.py`, `auth/routes/api.py` (`verify_user`)
- **Что:** Токены в URL — утекают через логи, referrer, историю браузера. Токены в JSON body — утекают через кэш и логирование
- **Исправление:** Перенести в заголовок `Authorization: Bearer <token>`

### 2.5 Открытые management-панели с дефолтными паролями
- **Где:** `docker-compose.yml`
- **Что:**
  - Mongo Express: порт 8081, логин `admin`/`admin`
  - Redis Commander: порт 8082, нет аутентификации
  - RustFS Console: порт 9001, `rustfsadmin`/`rustfsadmin`
  - Traefik Dashboard: порт 8080, `insecure: true`
- **Исправление:** Убрать в продакшене или закрыть паролями, биндить на `127.0.0.1`

### 2.6 Нет rate limiting на логин/верификацию
- **Где:** `backend/auth/routes/api.py` — `/email/login/start`, `/email/login/finish`
- **Что:** Можно спамить отправку кодов (email flooding) и брутфорсить 6-символьный код
- **Исправление:** Rate limit per IP + per email. Экспоненциальный backoff после неудач

### 2.7 Верификационный код логируется в plaintext
- **Где:** `backend/auth/services/auth.py` — `logger.info(f"Verification code for {email}: {code}")`
- **Что:** Код доступен в логах. Любой с доступом к логам может аутентифицироваться как любой юзер
- **Исправление:** Удалить логирование кода или ограничить уровнем DEBUG (выключен в prod)

### 2.8 Все сервисы используют один .env
- **Где:** `docker-compose.yml` — `env_file: - .env` у каждого сервиса
- **Что:** OAuth secrets, SMTP пароли, API-токены доступны всем сервисам
- **Исправление:** Раздельные `.env` файлы по принципу наименьших привилегий

### 2.9 Все порты проброшены на хост
- **Где:** `docker-compose.yml`
- **Что:** MongoDB :27017, Redis :6379, каждый микросервис :8000-8012, RustFS :9000-9001 — всё доступно извне, минуя Traefik
- **Исправление:** Убрать пробросы портов для всего, кроме Traefik :80/:443. Использовать Docker network

### 2.10 Пустой TOKEN fallback в Payment
- **Где:** `backend/payment/src/api/tap.rs`, `bonus.rs`
- **Что:** `std::env::var("TOKEN").unwrap_or_else(|_| "".to_string())` — если TOKEN не задан, сервис отправляет пустую строку
- **Исправление:** `panic!` при старте если TOKEN не задан

---

## 3. Безопасность — MEDIUM

### 3.1 Нет CSRF-защиты
- **Что:** POST-эндпоинты (open case, sell, profile update) аутентификация только по cookie, нет CSRF-токена
- **Исправление:** Добавить double-submit cookie или `X-Requested-With` header

### 3.2 Голый `except:` — поглощает ошибки
- **Где:** `cases/routes/case.py`, `cases/routes/item.py`
- **Что:** `except:` ловит **всё** (включая `SystemExit`) и возвращает 404 — скрывает реальные ошибки
- **Исправление:** Ловить конкретные исключения

### 3.3 Сессия 30 дней без ротации
- **Где:** `backend/auth/services/auth.py` — `max_age=30*24*60*60`
- **Исправление:** Уменьшить TTL, ротировать sid при привилегированных действиях

### 3.4 `f64` для финансовых операций
- **Где:** `backend/payment/src/db/models.rs`, `shared/schemas.rs`
- **Что:** IEEE 754 floating point — ошибки округления накапливаются
- **Исправление:** Целочисленные суммы (в минимальных единицах) или decimal

### 3.5 Swagger UI открыт без аутентификации
- **Где:** все сервисы — `payment/main.rs`, `admin/main.py`, `user/api.py`
- **Что:** Полная API-схема доступна любому
- **Исправление:** Отключить в production или закрыть auth

### 3.6 `print()` в production коде
- **Где:** `cases/services/auth.py` — `print(ssid)`, `print(response)`, `print(data)`, `auth/services/redis.py`, `auth/services/auth.py`
- **Что:** Session ID утекают в stdout, debug-вывод в production
- **Исправление:** Удалить все `print()`, использовать структурированное логирование

### 3.7 Race condition в rate limiting (tap)
- **Где:** `backend/payment/src/api/tap.rs` — `INCR` + `EXPIRE` не атомарные
- **Что:** Crash между INCR и EXPIRE → ключ без TTL → юзер заблокирован навсегда
- **Исправление:** Lua-скрипт или `SET key value EX 1 NX`

### 3.8 История выигрышей публично доступна
- **Где:** `backend/cases/routes/case.py` — `/wins/user/{user_id}`, `/wins/user/{user_id}/stats`
- **Что:** Нет аутентификации — любой может посмотреть всю историю любого юзера
- **Исправление:** Требовать auth, проверять права доступа

### 3.9 Нет лимита размера запросов
- **Что:** Ни один сервис не ограничивает размер body
- **Исправление:** Request size limit в FastAPI и Traefik

---

## 4. Функциональные проблемы (не безопасность)

> Баги и архитектурные проблемы, влияющие на корректность и надёжность.

### 4.1 Farm — апгрейды хранятся в localStorage (критично)
- **Где:** `frontend/src/pages/Farm.tsx`
- **Что:** `clickPowerLevel`, `clickMultiplierLevel`, `autoClickerLevel` — всё в localStorage. Сервер доверяет клиенту
- **Атака:** Юзер ставит `clickPower: 999999` через DevTools → бесконечные монеты
- **Исправление:** Серверная валидация. Апгрейды хранить и проверять на бэкенде

### 4.2 Farm — покупка апгрейдов через отрицательный tap
- **Где:** `frontend/src/pages/Farm.tsx` — `paymentApi.tap(-cost)`
- **Что:** Покупка апгрейда использует `tap` с отрицательным amount вместо нормальной транзакции. Не отображается в истории как покупка
- **Исправление:** Отдельный эндпоинт для покупки апгрейдов

### 4.3 Multi-open — N параллельных запросов без батчинга
- **Где:** `frontend/src/pages/CaseDetail.tsx` — `Promise.all` × N
- **Что:** `openMultiCase(3)` = 3 независимых `open()`. Усиливает race condition (1.7), нет серверного батчинга
- **Исправление:** Серверный эндпоинт `POST /open/{case_id}?count=N` с атомарным списанием

### 4.4 Мёртвый код
- `backend/auth/routes/broker.py` — FastStream subscriber, нигде не импортирован
- `backend/auth/services/auth.py` → `test()` — публикует 500 сообщений в stream, дебаг
- `frontend/src/services/api.ts` → `MOCK_MODE = false` — неиспользуемая константа
- `backend/cases/services/local_auth.py` — дублирует auth.py
- `backend/payment/src/api/transactions.rs` → `create_random()` — мёртвая функция (random транзакции на 555.0)

### 4.5 Docker — нет ресурсных лимитов и healthcheck'ов
- **Что:** Ни один сервис не имеет `mem_limit`, `deploy.resources`. Контейнерные healthcheck'и есть только у MongoDB
- **Исправление:** Добавить memory/CPU limits и healthcheck'и для всех сервисов

### 4.6 `get_user_by_email` неявно создаёт пользователей
- **Где:** `backend/user/services/user.py`
- **Что:** Функция «получить по email» автоматически создаёт юзера если не найден. Нарушает принцип наименьшего удивления
- **Исправление:** Разделить на `get()` и `create()`

---

## 5. Оценка: ELK-стек (через Redis Streams)

> Централизованный сбор, хранение и визуализация логов.

### Текущее состояние логирования

| Сервис | Библиотека | Формат | Структурированный? |
|--------|-----------|--------|---------------------|
| Auth | `logging` (stdlib) | Текст (stdout) | Нет |
| User | `logging` (stdlib) | Текст (stdout) | Нет |
| Cases | `loguru` (без конфига) | Текст (stdout) + `print()` | Нет |
| Admin | Ничего | — | — |
| Payment (Rust) | `println!`/`eprintln!` | Текст (stdout/stderr) | Нет |

**Вывод:** Логирование фрагментировано — 3 разных подхода + `print()`. Нет JSON, нет trace_id, нет корреляции.

### Архитектура через Redis Streams

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│ Auth (py)  │    │ Cases (py) │    │Payment(rs) │
│ structlog  │    │ structlog  │    │ tracing    │
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘
      │                 │                 │
      │  XADD logs      │  XADD logs      │  XADD logs
      ▼                 ▼                 ▼
┌─────────────────────────────────────────────────┐
│               Redis Streams                      │
│  Stream: logs  (consumer group: elk-pipeline)    │
└─────────────────────┬───────────────────────────┘
                      │ XREADGROUP
                      ▼
              ┌───────────────┐
              │   Logstash    │
              │ Redis input   │
              │ → transform   │
              │ → ES output   │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │ Elasticsearch │
              │  ~2 GB RAM    │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │    Kibana     │
              │  :5601        │
              └───────────────┘
```

### План реализации

| Шаг | Задача | Сложность |
|-----|--------|-----------|
| 1 | Стандартизация: `structlog` (Python), `tracing` (Rust) → JSON-формат | Средняя |
| 2 | Redis Streams writer: каждый сервис пишет `XADD logs * ...` вместо stdout | Низкая |
| 3 | Logstash: плагин `redis` input, consumer group, pipeline → Elasticsearch | Низкая |
| 4 | Docker Compose: Elasticsearch (~2 GB), Kibana, Logstash | Низкая |
| 5 | Kibana: дашборды по сервисам, уровням, trace_id | Низкая |

### Ресурсы

| Компонент | RAM | Диск |
|-----------|-----|------|
| Elasticsearch | 2 GB | 10+ GB (зависит от retention) |
| Kibana | 512 MB | — |
| Logstash | 512 MB | — |
| **Итого** | **~3 GB** | **10+ GB** |

### Сложность: **5/10**
- Основная работа — стандартизация логов в каждом сервисе
- Redis Streams уже используется проектом (Redis есть в стеке)
- ELK — хорошо документированный стек, плагин redis input есть у Logstash
- **Плюсы vs прямой сбор docker logs:** надёжная доставка (at-least-once), consumer groups, replay, buffering при недоступности ES

---

## 6. Оценка: Grafana + Prometheus (через Redis Streams)

> Мониторинг метрик, алертинг, визуализация состояния системы.

### Текущее состояние метрик
- **Ноль** — нет Prometheus-эндпоинтов, нет метрик, нет алертов
- Healthcheck'и только на уровне Traefik (опрос `/health` каждые 30с)
- Нет информации о загрузке CPU/RAM/диска контейнеров

### Архитектура через Redis Streams

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│ Auth (py)  │    │ Cases (py) │    │Payment(rs) │
│ middleware │    │ middleware │    │ middleware │
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘
      │                 │                 │
      │ XADD metrics    │ XADD metrics    │ XADD metrics
      ▼                 ▼                 ▼
┌─────────────────────────────────────────────────┐
│               Redis Streams                      │
│  Stream: metrics  (consumer group: prom)         │
└─────────────────────┬───────────────────────────┘
                      │ XREADGROUP
                      ▼
          ┌───────────────────────┐
          │ metrics-bridge        │
          │ (Python/Go consumer)  │
          │ → Prometheus exporter │
          │ :9090/metrics         │
          └───────────┬───────────┘
                      │ scrape
                      ▼
              ┌───────────────┐      ┌────────────────┐
              │  Prometheus   │◄─────│ cAdvisor       │
              │  :9090        │◄─────│ redis-exporter │
              └───────┬───────┘◄─────│ mongo-exporter │
                      │              └────────────────┘
                      ▼
              ┌───────────────┐
              │   Grafana     │
              │  :3000        │
              └───────────────┘
```

### Два подхода

**Вариант A: Классический (Prometheus pull)** — проще, стандартнее
- Каждый сервис выставляет `/metrics` (Python: `prometheus-fastapi-instrumentator`, Rust: `prometheus` crate)
- Prometheus скрейпит напрямую
- **Плюс:** нативная Pull-модель, никаких промежуточных звеньев
- **Минус:** нужно инструментировать каждый сервис

**Вариант B: Redis Streams bridge** — единый канал
- Сервисы пишут метрики в Redis Streams (`XADD metrics * ...`)
- Отдельный bridge-сервис читает stream → выставляет как Prometheus exporter
- **Плюс:** единый канал для логов и метрик, сервисы не знают про Prometheus
- **Минус:** дополнительный компонент (bridge), нестандартный паттерн

**Рекомендация:** Вариант A для метрик (стандартный Pull), Redis Streams — для логов (Блок 5). Причина: Prometheus Push Gateway считается антипаттерном для application-level метрик, а Redis Streams bridge по сути его аналог. Pull-модель надёжнее.

### Метрики для сбора

| Тип | Метрики |
|-----|---------|
| HTTP | request_count, request_duration_seconds (histogram), response_codes |
| Business | cases_opened_total, transactions_total, active_sessions, inventory_items |
| Infrastructure | mongodb_connections, redis_memory, redis_commands, container_cpu/mem (cAdvisor) |

### Ресурсы

| Компонент | RAM | Диск |
|-----------|-----|------|
| Prometheus | 1 GB | 5–20 GB (retention) |
| Grafana | 256 MB | — |
| cAdvisor | 128 MB | — |
| redis-exporter | 32 MB | — |
| mongodb-exporter | 32 MB | — |
| **Итого** | **~1.5 GB** | **5–20 GB** |

### Сложность: **6/10**
- Основная работа — добавить middleware/инструментацию в каждый сервис
- Для Rust нужен `metrics` или `prometheus` crate + axum middleware
- Grafana дашборды — шаблоны есть для FastAPI и MongoDB
- Много готовых экспортёров (redis-exporter, mongodb-exporter, cAdvisor)

---

## 7. Оценка: Keycloak

> Единый Identity Provider: SSO, OAuth2/OIDC, управление пользователями, 2FA.

### Текущая аутентификация

```
Frontend ──cookie:sid──▶ Backend Service
                            │
                            ▼ HTTP GET
                     Auth Service (/verify_user/{sid})
                            │
                            ├── HMAC-verify cookie
                            ├── Redis: lookup session
                            └── Return {uid, email, provider}
```

- 4 сервиса зависят от `verify_user` → auth = бутылочное горлышко
- Cookie-сессии, подписанные HMAC-SHA256 (с пустым default secret)
- OAuth через `fastapi-sso` (Discord, Yandex)
- Каждый авторизованный запрос = +1 HTTP hop к auth

### Что даёт Keycloak

| Возможность | Сейчас (самописный auth) | С Keycloak |
|-------------|--------------------------|------------|
| Пароль + email | Нет | Из коробки |
| 2FA (TOTP, email) | Нет | Из коробки |
| OAuth (Discord, Yandex, Google, GitHub) | fastapi-sso (2 провайдера) | GUI-конфиг, любое кол-во |
| SSO для инфраструктуры | Нет | Grafana, Kibana, RustFS через OIDC |
| JWT-токены | Нет (cookie-сессии) | Стандарт: access_token + refresh_token |
| Админ-консоль для юзеров | Своя в Admin service | Встроенная GUI |
| Account linking | Нет | Из коробки |
| Brute-force protection | Нет | Встроенный rate limiter |

### Архитектура с Keycloak

```
Frontend ──Bearer JWT──▶ Backend Service
                              │
                              ▼ Verify locally
                         JWKS public key (cached)
                              │
                              └── JWT claims: {sub, email, roles, ...}
                                  → Нет HTTP-hop к auth!
```

**Ключевое преимущество:** JWT валидируется **локально** каждым сервисом по публичному ключу JWKS. Цепочка `verify_user` полностью исчезает — auth service перестаёт быть бутылочным горлышком.

### План миграции

| Шаг | Задача | Сложность |
|-----|--------|-----------|
| 1 | Docker: запуск Keycloak + PostgreSQL/H2. Realm `casehub`, client `casehub-frontend` | Низкая |
| 2 | Frontend: `keycloak-js` adapter вместо своих Login/Register форм | Средняя |
| 3 | Python-сервисы: middleware валидации JWT через JWKS (библиотека `python-jose` или `PyJWT`) | Средняя |
| 4 | Rust (Payment): `jsonwebtoken` crate + кэширование JWKS | Средняя |
| 5 | OAuth: Discord + Yandex как Identity Providers в Keycloak GUI | Низкая |
| 6 | Миграция юзеров: скрипт MongoDB → Keycloak Admin REST API | Средняя |
| 7 | Удаление auth service, `fastapi-sso`, cookie-логики, `verify_user` | Низкая |
| 8 | SSO: Grafana + Kibana → OIDC → Keycloak | Низкая |

### Ресурсы

| Компонент | RAM | Диск |
|-----------|-----|------|
| Keycloak | 512 MB–1 GB | — |
| PostgreSQL (для Keycloak) | 256 MB | 1 GB |
| **Итого** | **~1–1.5 GB** | **~1 GB** |

### Сложность: **8/10**
- Затрагивает **все 5 бэкенд-сервисов** + фронтенд
- Rust-сервис (Payment) — нужна отдельная JWKS-валидация
- Миграция существующих юзеров
- Полная замена auth flow (cookie → JWT)
- Но: после миграции — на порядок проще добавлять провайдеров, 2FA, SSO

---

## 8. Приоритезация

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ПРИОРИТЕТ 1: Безопасность (CRITICAL + HIGH)
  1.1  Payment API — добавить аутентификацию
  1.2  MongoDB — включить auth, закрыть порт
  1.3  Redis — включить auth, закрыть порт
  1.4  SECRET_KEY — убрать пустой default
  1.7  Race condition — атомарные транзакции
  2.1  CORS — убрать wildcard на всех сервисах
  2.2  Verification code — удалять после использования
  2.3  Криптографический RNG для кейсов
  2.4  Токены — перенести в Authorization header
  2.5  Management-панели — закрыть/убрать
  2.6  Rate limiting на логин-эндпоинтах
  2.7  Убрать логирование верификационных кодов
  2.9  Закрыть все пробросы портов, кроме Traefik
  2.10 TOKEN — panic при пустом значении
  3.6  Убрать print() из production кода

ПРИОРИТЕТ 2: Функциональные проблемы
  4.1  Farm — серверная валидация апгрейдов
  4.2  Farm — отдельный эндпоинт для покупок
  4.3  Multi-open — серверный батчинг
  4.4  Удалить мёртвый код
  4.5  Docker — resource limits + healthchecks
  4.6  Разделить get/create user

ПРИОРИТЕТ 3: TLS + Cookie Secure
  1.5  HTTPS / TLS в Traefik
  1.6  cookie_secure = True

ПРИОРИТЕТ 4: Наблюдаемость
  5.*  ELK (structlog + Redis Streams + Logstash + ES + Kibana)
  6.*  Grafana + Prometheus (middleware + exporters)

ПРИОРИТЕТ 5: Keycloak
  7.*  Полная миграция авторизации на Keycloak

ПРИОРИТЕТ 6: Оставшаяся безопасность (MEDIUM)
  3.1  CSRF-защита
  3.2  Исправить bare except
  3.3  Ротация сессий
  3.4  Integer вместо f64 для финансов
  3.5  Закрыть Swagger в production
  3.7  Атомарный rate limiting
  3.8  Требовать auth для истории юзера
  3.9  Лимит размера запросов

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 9. Оценка ресурсов сервера

### Текущий стек (без мониторинга / Keycloak)

| Компонент            | RAM (idle) | RAM (нагрузка) | Диск          |
|----------------------|------------|----------------|---------------|
| Traefik v3           | ~30 MB     | ~50 MB         | ~50 MB        |
| Redis 8.4            | ~50 MB     | ~256 MB        | ~100 MB       |
| MongoDB 8.0          | ~300 MB    | ~1 GB          | 1–10 GB*      |
| RustFS (S3)          | ~64 MB     | ~128 MB        | 5–50 GB**     |
| Auth API (Python)    | ~80 MB     | ~200 MB        | ~100 MB       |
| User API (Python)    | ~80 MB     | ~200 MB        | ~100 MB       |
| Cases API (Python)   | ~80 MB     | ~200 MB        | ~100 MB       |
| Admin API (Python)   | ~80 MB     | ~200 MB        | ~100 MB       |
| Payment (Rust)       | ~20 MB     | ~50 MB         | ~50 MB        |
| Frontend (Nginx)     | ~10 MB     | ~30 MB         | ~50 MB        |
| Mongo Express (dev)  | ~50 MB     | ~80 MB         | ~50 MB        |
| Redis Commander (dev)| ~40 MB     | ~60 MB         | ~50 MB        |
| **Итого (текущий)**  | **~900 MB**| **~2.5 GB**    | **7–60 GB**   |

\* Зависит от количества пользователей и кейсов
\** Зависит от количества скинов/изображений

### Планируемые дополнения

| Компонент                       | RAM          | Диск        |
|---------------------------------|--------------|-------------|
| ELK Stack (ES + Logstash + KB)  | ~3 GB        | 10–50 GB    |
| Grafana + Prometheus            | ~1.5 GB      | 5–20 GB     |
| Keycloak + PostgreSQL           | ~1.5 GB      | ~1 GB       |
| **Итого (дополнения)**          | **~6 GB**    | **16–71 GB**|

### Итоговая оценка

| Сценарий                         | RAM min   | RAM рекомендуемый | Диск         |
|----------------------------------|-----------|--------------------|--------------|
| Только текущий стек              | 2 GB      | 4 GB               | 20 GB        |
| + ELK                           | 5 GB      | 8 GB               | 40 GB        |
| + Grafana + Prometheus           | 3.5 GB    | 6 GB               | 30 GB        |
| + Keycloak                      | 3.5 GB    | 6 GB               | 25 GB        |
| Всё вместе (полный стек)        | 8 GB      | **16 GB**          | **80–120 GB**|

> **Рекомендация:** Для продакшена с полным стеком (мониторинг + SSO) — VPS/VDS **16 GB RAM / 4 vCPU / 120 GB SSD**. Для MVP без мониторинга — достаточно **4 GB RAM / 2 vCPU / 40 GB SSD**.

---

## 10. Архитектура бэкенда — улучшения

> Фичи и рефакторинги, которые ускорят разработку, повысят надёжность и упростят поддержку.

### 10.1 Shared-библиотека (`backend/shared/`)

**Проблема:** ~1000 строк copy-paste кода продублированы между сервисами.

| Дублированный код | Где | Строк × сервисов |
|-------------------|-----|-------------------|
| `RedisService` | auth, user | ~40 × 2 |
| `RedisManager` | auth, user | ~45 × 2 (идентичны) |
| `MailSender` | auth, user | ~25 × 2 (идентичны) |
| `connect_db()` | auth, user, cases | ~8 × 3 |
| `ConfigProvider` для Dishka | все 4 Python-сервиса | ~5 × 4 |
| UUID `field_serializer` (3 шт.) | все модели (session, user, case, item) | ~12 × 4 |
| `time_now()` хелпер | все модели | ~3 × 4 |
| `Settings.model_config` | все 4 settings.py | идентичный блок |
| Pydantic-схемы (`Rarity`, `Weapon`, `CaseContent`) | cases + admin schemas | дублированы |
| CORS middleware настройка | все 4 api.py/main.py | идентичная |

**Что вынести в `backend/shared/`:**
- `RedisService`, `RedisManager`, `MailSender`
- `connect_db()` с параметром `document_models`
- `BaseServiceSettings` с общими полями (`mongodb_url`, `redis_url`, `token`, `log_level`)
- `ConfigProvider` для Dishka
- `BaseDocument` mixin (UUID id, `created_at`, serializers, `bson_encoders`)
- Общие Pydantic-схемы
- Общие exceptions (`NotFoundError`, `InsufficientFundsError`, `ServiceUnavailableError`)
- Фабрика health-check эндпоинта

**Трудозатраты:** Средние (обновить все Dockerfiles: `COPY shared/ ./shared/`, поправить импорты)
**Импакт:** Высокий — баг фиксится в одном месте вместо четырёх

---

### 10.2 Блокирующий I/O в async event loop

**Проблема:** Синхронные вызовы замораживают весь event loop, блокируя обработку всех запросов.

| Блокирующий вызов | Где | Что происходит |
|-------------------|-----|----------------|
| `smtplib.SMTP` | `auth/services/mail.py`, `user/services/mail.py` | Сетевое подключение к SMTP-серверу + отправка письма — **блокирует** на 1–5 сек |
| `boto3.client.upload_fileobj()` | `admin/services/storage.py` | Загрузка файла в RustFS — блокирует на время аплоада |

**Исправление:**
- `smtplib` → `aiosmtplib` (drop-in async замена, 1 зависимость)
- `boto3` → `aioboto3` или `asyncio.to_thread(self.client.upload_fileobj, ...)`

**Трудозатраты:** Низкие (замена ~5 строк в каждом файле)
**Импакт:** Высокий — убирает полную заморозку сервера при отправке email/аплоаде

---

### 10.3 Индексы MongoDB + N+1 запросы

**Проблема:** Ни одна Beanie-модель не определяет индексы. Все запросы — full collection scan.

**Критичные запросы без индексов:**
- `User.find_one(User.email == email)` — каждый логин
- `Case.find_one(Case.system_name == name)` — каждое открытие кейса
- `Item.find_one(Item.id == id)` — каждый lookup предмета
- `Win.find(Win.user_id == uid)` — история пользователя

**N+1 в `CaseService.get()`:** Загружает ВСЕ кейсы, потом для каждого вызывает `_build_case_content()`, который делает `get_by_id()` для каждого предмета. При 50 кейсах × 10 предметов = **500 запросов к БД** на один GET /cases/.

**Исправление:**
```python
class User(Document):
    class Settings:
        indexes = [
            IndexModel([("email", 1)], unique=True),
        ]
```
- Для N+1: batch-загрузка всех item_id одним `Item.find(In(Item.id, all_ids))`

**Трудозатраты:** Низкие (индексы — по 3 строки на модель, N+1 — рефактор одного метода)
**Импакт:** Высокий — разница в производительности на порядки при росте данных

---

### 10.4 Кэширование верификации сессий

**Проблема:** Каждый авторизованный запрос в Cases, Admin, Payment → синхронный HTTP GET к Auth Service → Auth идёт в Redis/MongoDB. Auth = SPOF и бутылочное горлышко.

```
Юзер → Cases API → HTTP GET /verify_user/{sid} → Auth → Redis → MongoDB
       (каждый запрос = +1 сетевой hop + 2 DB lookup)
```

**Исправление:** TTL-кэш результата верификации (30 сек) в вызывающем сервисе:
- Cases/Admin: `lru_cache` или Redis GET с TTL перед HTTP-вызовом
- При logout/блокировке: Auth invalidates через Redis pub/sub

**Трудозатраты:** Средние
**Импакт:** Высокий — снижает нагрузку на Auth в N раз (где N = среднее кол-во запросов юзера за 30 сек)

---

### 10.5 Двойная регистрация роутов

**Где:** `backend/cases/routes/__init__.py`
```python
router.include_router(caser, prefix="/cases")
router.include_router(caser)  # ← дублирует все эндпоинты на /
```
Все case-эндпоинты смонтированы дважды: на `/cases/...` и на `/...`. Swagger показывает двойной набор.

**Трудозатраты:** 1 мин — удалить одну строку
**Импакт:** Убирает путаницу и дублированные роуты

---

### 10.6 `asyncio.Lock()` создаётся заново каждый вызов

**Где:** `cases/ioc.py`, `admin/ioc.py` — внутри `@provide` метода:
```python
async def get_session(self) -> AsyncGenerator:
    lock = asyncio.Lock()  # ← новый Lock каждый раз
    async with lock:
        ...
```
Lock создаётся *внутри* метода, а не на уровне класса → каждый вызов получает свой Lock → **нет синхронизации вообще**.

**Трудозатраты:** 2 мин — перенести `lock` в `__init__` класса
**Импакт:** Средний — исправляет потенциальные race conditions в DI

---

### 10.7 Graceful shutdown

**Проблема:** `lifespan` context managers в сервисах только инициализируют ресурсы, но не закрывают:
- `aiohttp.ClientSession` не закрывается → `ResourceWarning`
- Redis-соединения не закрываются
- MongoDB-клиент не закрывается

**Исправление:** `yield` в lifespan + cleanup:
```python
@asynccontextmanager
async def lifespan(app):
    await connect_db()
    yield
    # cleanup
    await session.close()
    await redis.close()
```

**Трудозатраты:** Низкие (добавить cleanup после `yield` в каждом lifespan)
**Импакт:** Средний — устраняет утечки соединений при перезапусках

---

### 10.8 Общий `pyproject.toml` для всех сервисов

**Где:** `backend/pyproject.toml` — один файл на все Python-сервисы

**Проблема:** Каждый сервис устанавливает ВСЕ зависимости (boto3, fastapi-sso, robyn, faststream, beanie), даже если не использует их. Admin не нужен `beanie`, Auth не нужен `boto3`.

**Исправление:**
- Вариант A: Раздельные `pyproject.toml` для каждого сервиса
- Вариант B: Dependency groups (`[project.optional-dependencies]`): `auth`, `cases`, `admin`, `user`

**Трудозатраты:** Средние
**Импакт:** Средний — уменьшает размер образов, ускоряет сборку, снижает attack surface

---

### 10.9 Dev-режим с hot reload

**Проблема:** Нет `docker-compose.override.yml` для разработки. Каждое изменение кода требует пересборки образа (`docker compose up -d --build`).

**Исправление:** `docker-compose.override.yml`:
```yaml
services:
  auth-api:
    volumes:
      - ./backend/auth:/app
    command: uvicorn api:app --reload --host 0.0.0.0
```

**Трудозатраты:** Низкие (~30 мин)
**Импакт:** Высокий — ускоряет цикл разработки с минут до секунд

---

### 10.10 Тестирование — нулевое покрытие

**Текущее состояние:** Ноль тестов. Нет `pytest` в зависимостях, нет `conftest.py`, нет CI.

**Минимальный стартовый набор:**

| Что тестировать | Тип | Приоритет |
|-----------------|-----|-----------|
| `CaseService.open()` — drop chance, баланс | Unit | Высокий |
| `create_transaction()` — атомарность | Integration | Высокий |
| Auth flow (send code → verify) | Integration | Средний |
| Admin CRUD прокси | E2E | Низкий |

**Зависимости:** `pytest`, `pytest-asyncio`, `httpx` (TestClient), `mongomock-motor` или `testcontainers`

**Трудозатраты:** Средние (настройка инфраструктуры) → далее инкрементально
**Импакт:** Высокий — единственный способ рефакторить без страха

---

### 10.11 Admin Service — чистый HTTP-прокси без добавленной ценности

**Проблема:** Admin Service (~800 строк) — это буквально HTTP pass-through к Cases/User/Auth. Каждый метод:
```python
async def create_case(self, data, token):
    resp = await self.session.post(f"{self.url}/cases/", json=data, headers={"token": token})
    return resp.json()
```
Это добавляет: +1 сетевой hop, +1 точку отказа, +800 строк boilerplate.

**Варианты:**
- A: Убрать Admin Service, фронтенд вызывает Cases/User напрямую с admin-токеном → **Сильно упрощает**
- B: Оставить как API Gateway, но добавить ценность (агрегация, кэширование, audit log) → **Оправдывает существование**

**Трудозатраты:** Средние–высокие (зависит от варианта)
**Импакт:** Средний — упрощает архитектуру и debug

---

### 10.12 `delete_session` определён дважды в Auth

**Где:** `backend/auth/services/session.py` — метод `delete_session` определён на ~строке 40 и ~строке 85. Второй молча перезаписывает первый.

**Трудозатраты:** 5 мин
**Импакт:** Низкий, но потенциальный источник багов

---

### Приоритизация архитектурных улучшений

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ПРИОРИТЕТ A: Быстрые фиксы (< 1 часа, высокий импакт)
  10.5  Убрать двойную регистрацию роутов
  10.6  Починить asyncio.Lock в ioc.py
  10.12 Убрать дублированный delete_session
  10.2  Заменить smtplib → aiosmtplib (async email)

ПРИОРИТЕТ B: Средние затраты, высокий импакт
  10.3  Добавить индексы MongoDB + исправить N+1
  10.9  docker-compose.override.yml с hot reload
  10.7  Graceful shutdown (cleanup в lifespan)
  10.2  Заменить boto3 → aioboto3 (async S3)

ПРИОРИТЕТ C: Стратегические улучшения
  10.1  Shared-библиотека (устранение дублирования)
  10.4  Кэширование верификации сессий
  10.8  Раздельные зависимости per-service
  10.10 Старт тестирования (pytest + базовые тесты)

ПРИОРИТЕТ D: Архитектурные решения
  10.11 Пересмотр роли Admin Service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 11. UX-улучшения фронтенда

> Фичи, которые бустят пользовательский опыт без крупных архитектурных изменений.

| # | Улучшение | UX-импакт | Трудозатраты | Приоритет |
|---|-----------|-----------|--------------|-----------|
| 1 | Toast на успешные действия (продажа, бонус, ник) | Высокий | 30 мин | ★★★ |
| 2 | Skeleton-лоадеры вместо спиннеров | Высокий | 1–2 ч | ★★★ |
| 3 | Горячие клавиши (Enter — открыть, Space — скип) | Средний | 30 мин | ★★★ |
| 4 | Централизация `rarityColors` (4 дубля → 1 файл) | Низкий (DX) | 30 мин | ★★☆ |
| 5 | Пустые состояния с CTA ("Открыть кейсы →") | Средний | 1 ч | ★★★ |
| 6 | Звуковые эффекты (спиннер, выигрыш, тап, продажа) | Очень высокий | 4–6 ч | ★★★ |
| 7 | Пагинация / infinite scroll для истории | Средний | 3–4 ч | ★★☆ |
| 8 | Шаринг выигрыша (ссылка / карточка) | Высокий (рост) | 3–4 ч | ★★☆ |
| 9 | Консистентные auth guards (убрать inline дубли) | Низкий | 1 ч | ★★☆ |
| 10 | Batch multi-open (серверный эндпоинт) | Средний | 6–8 ч | ★☆☆ |
| 11 | PWA manifest + favicon | Средний | 1–2 ч | ★★☆ |
| 12 | Виртуализация длинных списков (`@tanstack/react-virtual`) | Средний | 3–4 ч | ★☆☆ |

---

## 12. Мейнстримные фичи — конкурентный анализ

> Фичи, которые являются стандартом индустрии (CSGOEmpire, DatDrop, Key-Drop, Hellcase), но отсутствуют в CaseHub. Каждая может стать фишкой проекта.

### 12.1 Provably Fair — криптографическое доказательство честности

**Статус: ОТСУТСТВУЕТ — критический разрыв с рынком**

Сейчас CaseHub использует `random.choices()` (`backend/cases/services/case.py`). Результат генерируется полностью на сервере. У пользователя **ноль возможностей** проверить честность.

**Как работает у конкурентов (commit-reveal):**

```
┌─ До игры ───────────────────────────────────────┐
│  server_seed = random(256 bit)                   │
│  server_seed_hash = SHA256(server_seed)           │
│          ↓ показывается юзеру ДО ставки          │
│  client_seed = ввод юзера (или random default)   │
│  nonce = auto-increment per user                 │
└──────────────────────────────────────────────────┘
┌─ На открытие ────────────────────────────────────┐
│  roll = HMAC-SHA256(server_seed, client_seed:nonce)│
│  float = first 8 hex → int / 0xFFFFFFFF          │
│  item = map float → cumulative drop_chance        │
│  nonce++                                         │
└──────────────────────────────────────────────────┘
┌─ Верификация ────────────────────────────────────┐
│  Юзер ротирует server_seed → старый раскрывается │
│  SHA256(revealed) == committed hash? ✓            │
│  Пересчёт HMAC → подтверждение результата        │
└──────────────────────────────────────────────────┘
```

**API:**
- `GET /fair/seeds/active` — текущий hash + client_seed + nonce
- `POST /fair/seeds/client` — установить свой client seed
- `POST /fair/seeds/rotate` — ротация server seed (раскрытие старого)
- `GET /fair/verify/{game_id}` — верификация конкретной игры

**Модель:** `ProvablyFairSeed (server_seed, server_seed_hash, client_seed, nonce, user_id, active)`

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2–3 нед.) | **КРИТИЧЕСКИЙ** — без этого сайт не воспринимается серьёзно | Средний | Высокий (ссылки верификации — органический proof) |

---

### 12.2 Case Battles — мультиплеер

**Статус: ОТСУТСТВУЕТ**

Case Battles — **#1 фича по вовлечению** на DatDrop, Key-Drop, Hellcase. Часто популярнее solo-открытия.

**Как работает:**
- Игрок создаёт комнату, выбирает кейсы, задаёт кол-во игроков (2–4)
- Другие игроки заходят и платят (стоимость = цена кейсов)
- Все кейсы открываются одновременно. Победитель (max total value) забирает ВСЕ предметы
- Provably Fair сидирование per battle

**Архитектура:**
```
┌─ BattleService ──────────────────────────────┐
│  POST /battles/create   (cases, max_players) │
│  POST /battles/{id}/join                     │
│  GET  /battles/lobby     (активные комнаты)  │
│  WS   /battles/{id}/live (real-time)         │
└──────────────────────────────────────────────┘

Models:
  Battle      (id, cases[], players[], status, seed, winner_id)
  BattlePlayer(user_id, items_won[], total_value)

Redis: lobby state, matchmaking
WebSocket: синхронизация анимации открытия
```

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Высокая (4–6 нед.) | Средний | **Очень высокий** — соревновательный элемент | Очень высокий (shareable battles, spectator mode) |

---

### 12.3 Реферальная система

**Статус: ОТСУТСТВУЕТ**

Реферальная система — **#1 канал привлечения** на всех case-сайтах. Стримерская экономика полностью построена на реферальных кодах.

**Как работает:**
- Каждый юзер получает уникальный код/ссылку
- Приглашённый получает бонус при регистрации (бесплатный кейс / бонус к депозиту)
- Приглашающий получает % комиссию с каждого открытия кейса приглашённым (1–5%)
- Дашборд: статистика рефералов, заработок, вывод
- Стримеры/аффилиаты получают кастомные коды с повышенной комиссией

**Модели:**
```
ReferralCode    (code, user_id, commission_rate, uses, created_at)
ReferralUse     (code, referred_user_id, timestamp)
ReferralEarning (referrer_id, amount, source_user_id, source_action)
```

**Хуки:** `on case_open → check if user was referred → credit referrer`

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2 нед.) | Низкий | Средний | **Очень высокий** — основной UA-канал индустрии |

---

### 12.4 Апгрейд / Контракт предметов

**Статус: ОТСУТСТВУЕТ**

**Апгрейд:** Юзер ставит предмет, выбирает целевой предмет дороже. Шанс = (стоимость_ставки / стоимость_цели) × 100%. Выиграл → получил; Проиграл → потерял.

**Контракт:** Объединение 10 предметов одной редкости в 1 предмет следующего тира (как CS2 trade-up).

**Зачем:** Даёт смысл дешёвым дропам. Без апгрейда юзер получает "серый" предмет → разочарование → уход. С апгрейдом → "серый" предмет → шанс превратить в "золотой" → продолжение сессии.

**API:**
```
POST /upgrades/calculate    (input_item_id, target_item_id → chance%)
POST /upgrades/execute      (input_item_id, target_item_id → result)
GET  /upgrades/history
```

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2–3 нед.) | Низкий | **Высокий** — retention loop для дешёвых дропов | Средний |

---

### 12.5 Лидерборды

**Статус: ОТСУТСТВУЕТ** (данные уже есть в WinHistory)

**Категории:** топ по профиту, по количеству открытий, по max выигрышу, по стрику апгрейдов
**Периоды:** день / неделя / месяц / всё время
**Призы:** бонусная валюта, эксклюзивные кейсы для топ-позиций

**Архитектура:** Redis Sorted Sets (`ZADD leaderboard:profit:daily user_id score`). Данные уже есть — нужна только агрегация.

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| **Низкая (1–2 нед.)** | Средний | Высокий — соревнование | Средний (shareable rankings) |

---

### 12.6 Live-статистика сайта

**Статус: ОТСУТСТВУЕТ**

Баннер на главной: "14,523,891 кейсов открыто" / "234 юзера онлайн". Создаёт social proof и доверие.

**Архитектура:** Redis-счётчики (`INCR stats:total_cases_opened`), один эндпоинт `GET /stats/global`, animated CountUp на фронте (компонент уже есть).

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| **Низкая (3–5 дней)** | Высокий — social proof | Низкий | Средний |

---

### 12.7 WebSocket вместо SSE + polling

**Статус: ЧАСТИЧНЫЙ** — SSE только для ленты выигрышей, баланс через polling

**Что даст полный WebSocket:**
- Мгновенное обновление баланса при любой транзакции (сейчас — polling 5–30 сек)
- Live-уведомления о дропах на всех страницах (FOMO-эффект)
- Необходим для Case Battles (real-time синхронизация)
- Онлайн-счётчик юзеров

**Архитектура:** WebSocket gateway + Redis pub/sub каналы (`balance:{user_id}`, `drops:global`, `battles:{room_id}`)

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2 нед.) | Средний — feels professional | Высокий — dopamine loop | Низкий |

---

### 12.8 Система достижений / бейджей

**Статус: ОТСУТСТВУЕТ**

**Примеры:** "Открой 100 кейсов", "Выиграй Legendary предмет", "5 апгрейдов подряд", "Пригласи 10 друзей"
**Награды:** XP, бейджи в профиле, бонусная валюта, доступ к эксклюзивным кейсам
**Прогрессия:** Уровни юзера с XP-баром

**Архитектура:** Event-driven: `on case_open / upgrade / battle → check achievement conditions → award`

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2–3 нед.) | Низкий | Высокий — progression loop | Низкий |

---

### 12.9 i18n — мультиязычность

**Статус: ОТСУТСТВУЕТ — 100% хардкод на русском**

~200–300 строковых литералов разбросаны по всем компонентам. Нет `react-i18next`, нет файлов переводов, нет переключателя языка.

**Без английского языка CaseHub невидим для 80%+ мирового рынка.**

**Что нужно:** `react-i18next` + `i18next`, извлечение строк в `locales/{lang}/translation.json`, `LanguageProvider`, переключатель в Navbar. Бэкенд: возвращать i18n-ключи вместо текстовых сообщений.

| Сложность | Доверие | Вовлечение | Рост |
|-----------|---------|------------|------|
| Средняя (2–3 нед. на 2 языка) | Низкий | Низкий | **Очень высокий** — открывает глобальный рынок |

---

### Приоритизация мейнстримных фич

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P0 — Must have (без этого проект не конкурентен)
  12.1  Provably Fair      — доверие = основа индустрии
  12.9  i18n (EN + RU)     — 80% рынка заблокировано

P1 — High (максимальный ROI)
  12.3  Реферальная система — #1 канал привлечения
  12.5  Лидерборды         — быстрая реализация, высокий engagement
  12.6  Live-статистика    — 3–5 дней, social proof

P2 — Medium (ключевые фичи конкурентов)
  12.2  Case Battles       — #1 по вовлечению, но сложный
  12.4  Апгрейд/Контракт   — retention для дешёвых дропов
  12.7  WebSocket           — prerequisite для Battles
  12.8  Достижения         — progression loop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 13. Архитектурные паттерны — gRPC, BFF, CQRS и другие

> Анализ мейнстримных паттернов, которые могут решить текущие архитектурные проблемы CaseHub.

### Текущая карта вызовов (baseline)

```
Browser                                                    
  │ HTTP/JSON                                              
  ▼                                                        
Traefik (:80) ─── dumb proxy, zero auth ───                
  ├─► /api/auth/*    → authservice                         
  ├─► /api/user/*    → userservice                         
  ├─► /api/cases/*   → casesservice                        
  ├─► /api/admin/*   → adminservice (BFF)                  
  └─► /api/payment/* → paymentservice (Rust)               
                                                           
Inter-service (всё HTTP/1.1 JSON):                         
  casesservice ──► authservice   (verify_user — каждый req) 
  casesservice ──► paymentservice (balance + debit)         
  casesservice ──► userservice   (get user)                 
  adminservice ──► authservice   (verify_user)              
  adminservice ──► userservice   (role check, CRUD proxy)   
  adminservice ──► casesservice  (CRUD proxy)               
  authservice  ──► userservice   (get-or-create on login)   
  paymentservice ──► authservice (verify_user для tap/bonus) 
```

**Проблемы:**
- **Открытие кейса = 5 hops** (Traefik → cases → auth → user → payment×2)
- **Auth = SPOF** — каждый сервис вызывает `GET /verify_user/{sid}` синхронно
- **Admin BFF = 85% proxy** — 655 строк кода не добавляющих ценности
- **Всё JSON/HTTP** — нет type safety между сервисами, нет binary serialization

---

### 13.1 Traefik ForwardAuth — централизация аутентификации

**Проблема:** Каждый сервис самостоятельно вызывает `GET authservice/verify_user/{sid}`. Это +1 сетевой hop на **каждый** авторизованный запрос, плюс auth — единая точка отказа.

**Решение:** Traefik ForwardAuth middleware — перед тем как проксировать запрос в сервис, Traefik сам вызывает auth и пробрасывает результат в заголовках.

```
┌─ СЕЙЧАС ──────────────────────────────┐
│ Browser → Traefik → casesservice      │
│                         │              │
│                    GET authservice     │  ← доп. hop внутри сервиса
│                         │              │
│                    GET userservice     │  ← ещё hop
│                         ▼              │
│                    (бизнес-логика)     │
└───────────────────────────────────────┘

┌─ С FORWARDAUTH ───────────────────────┐
│ Browser → Traefik                     │
│              │                         │
│         ForwardAuth → authservice     │  ← Traefik делает verify
│              │                         │
│         X-User-Id: abc                │  ← inject headers
│         X-User-Role: admin            │
│              │                         │
│              ▼                         │
│         casesservice                  │  ← сервис доверяет headers
│         (бизнес-логика, 0 auth hops)  │
└───────────────────────────────────────┘
```

**Конфигурация Traefik:**
```yaml
# traefik/dynamic/services.yml
http:
  middlewares:
    auth-forward:
      forwardAuth:
        address: "http://authservice:8000/verify_forward"
        authResponseHeaders:
          - "X-User-Id"
          - "X-User-Email"
          - "X-User-Role"

  routers:
    cases:
      middlewares:
        - auth-forward
        - cases-strip
```

**Новый эндпоинт в auth:**
```python
@router.get("/verify_forward")
async def verify_forward(request: Request):
    sid = request.cookies.get("sid")
    if not sid:
        return Response(status_code=401)
    user = await session_service.verify(sid)
    return Response(
        status_code=200,
        headers={
            "X-User-Id": str(user.id),
            "X-User-Email": user.email,
            "X-User-Role": user.role,
        }
    )
```

**Что это даёт:**
- Убирает `verify_user` HTTP-вызов из **каждого** сервиса (cases, admin, payment)
- Cases: открытие кейса = 4 hops → **2 hops** (payment balance + debit)
- Payment tap: 3 hops → **1 hop** (только MongoDB write)
- Публичные эндпоинты (GET /cases/, /wins/) — без ForwardAuth middleware
- Единая точка авторизации, но с кэшированием в Traefik

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Низкая–средняя | **Очень высокий** — убирает главный bottleneck | 1–2 нед. |

---

### 13.2 gRPC для inter-service communication

**Проблема:** Все межсервисные вызовы — HTTP/1.1 JSON. Это:
- Нет type safety (сервис поменял ответ → другой упал в runtime)
- JSON serialization overhead (~2–5x vs protobuf)
- Нет streaming для real-time обновлений
- Нет code generation — каждый сервис вручную формирует запросы

**Решение:** gRPC с Protocol Buffers для inter-service, HTTP/JSON остаётся для frontend ↔ Traefik.

```
Browser ──HTTP/JSON──► Traefik ──HTTP/JSON──► Service (API layer)
                                                │
                                          gRPC (binary, typed)
                                                │
                                    ┌───────────┼───────────┐
                                    ▼           ▼           ▼
                              PaymentSvc   UserSvc    AuthSvc
```

**Proto-файлы (пример):**
```protobuf
// proto/payment.proto
service PaymentService {
  rpc GetBalance(UserIdRequest) returns (BalanceResponse);
  rpc CreateTransaction(TransactionRequest) returns (TransactionResponse);
  rpc CheckAndDebit(DebitRequest) returns (DebitResponse);  // ← атомарный!
}

message DebitRequest {
  string user_id = 1;
  double amount = 2;
  string description = 3;
}

message DebitResponse {
  bool success = 1;
  double new_balance = 2;
  string transaction_id = 3;
  string error = 4;  // "insufficient_funds" etc.
}
```

**Что это даёт:**
| Плюс | Детали |
|------|--------|
| **Type safety** | Proto-контракт между сервисами. Изменение API → ошибка компиляции, не рантайма |
| **Перфоманс** | Protobuf ~2–5x меньше JSON по размеру, ~5–10x быстрее сериализация |
| **Code generation** | `grpcio-tools` (Python), `tonic` (Rust) — клиенты генерируются автоматически |
| **Streaming** | Server streaming для SSE замены, bidirectional для WebSocket замены |
| **Атомарный debit** | Можно объединить `balance check + debit` в один gRPC вызов `CheckAndDebit` |

**Минусы и нюансы:**
| Минус | Детали |
|-------|--------|
| **Build complexity** | Protobuf compiler в CI, shared proto repo, code generation step |
| **Rust ↔ Python interop** | Python: `grpcio` + `grpcio-tools`, Rust: `tonic` — разные экосистемы |
| **Debugging** | Binary protocol — нельзя `curl` для теста, нужен `grpcurl` или Evans |
| **Traefik** | Traefik поддерживает gRPC, но нужна TLS (gRPC by default requires HTTP/2) |

**Реалистичная оценка для CaseHub:**
gRPC максимально полезен для **Payment ↔ Cases** связи (высокая частота, атомарность) и **Auth ↔ \*** (verify_user). Для Admin CRUD proxy — overkill.

**Рекомендация:** Начать с gRPC только для Payment service (наибольший выигрыш от type safety + атомарного debit), потом расширять.

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Средняя–высокая | Средний (перфоманс), Высокий (type safety) | 3–4 нед. |

---

### 13.3 BFF-рефакторинг — ликвидация Admin proxy

**Проблема:** Admin Service — 800+ строк, из которых 655 — чистый HTTP-прокси без добавленной ценности. Каждый admin-запрос проходит лишний hop.

**Текущий Admin Service value map:**
```
admin/services/
  ├── auth.py       (53 строки)  — ✅ Реальная логика: verify sid + role check
  ├── storage.py    (68 строк)   — ✅ Реальная логика: S3 upload
  ├── case.py       (120 строк)  — ❌ Прокси: POST/GET/PUT/DELETE → casesservice
  ├── item.py       (95 строк)   — ❌ Прокси: CRUD → casesservice
  ├── rarity.py     (88 строк)   — ❌ Прокси: CRUD → casesservice
  ├── tag.py        (87 строк)   — ❌ Прокси: CRUD → casesservice
  ├── weapon.py     (90 строк)   — ❌ Прокси: CRUD → casesservice
  ├── weapon_type.py(90 строк)   — ❌ Прокси: CRUD → casesservice
  └── user.py       (85 строк)   — ❌ Прокси: CRUD → userservice
```

**Решение: ForwardAuth + прямая маршрутизация**

```
┌─ СЕЙЧАС ──────────────────────────────────────┐
│ Browser → Traefik → adminservice → casesservice│
│                     (655 строк proxy)          │
│           = 3 hops на каждый CRUD              │
└────────────────────────────────────────────────┘

┌─ ПОСЛЕ ───────────────────────────────────────┐
│ Browser → Traefik (ForwardAuth: role=admin)    │
│              └──► casesservice напрямую         │
│           = 1 hop, 0 proxy кода                │
│                                                │
│ S3 upload → маленький сервис или эндпоинт      │
│             в casesservice                     │
└────────────────────────────────────────────────┘
```

**Traefik-конфиг:**
```yaml
http:
  middlewares:
    admin-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward_admin"
        # Возвращает 200 только если role == "admin"

  routers:
    admin-cases:
      rule: "PathPrefix(`/api/admin/cases`)"
      middlewares: [admin-auth, strip-admin-cases]
      service: casesservice
```

**Результат:**
- Удаление  ~655 строк proxy-кода
- Каждый admin CRUD: 3 hops → 1 hop
- S3 upload: отдельный эндпоинт в casesservice или micro-сервис
- AuthService: один новый эндпоинт `/verify_forward_admin` (5 строк)

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Низкая–средняя | Средний (DX + latency) | 1 нед. |

---

### 13.4 CQRS (light) — разделение чтения и записи

**Проблема:** `GET /cases/` делает N+1 запросов к MongoDB (500 queries при 50 кейсах × 10 предметов). Та же модель используется и для чтения (frontend), и для записи (admin CRUD).

**Решение:** Read-модель (денормализованная) + Write-модель (нормализованная).

```
┌─ WRITE (Admin CRUD) ─────────────────┐
│  Case document (MongoDB):            │
│  { name, content: [item_id, ...] }   │
│                                      │
│  Item document (MongoDB):            │
│  { name, price, rarity_id, ... }     │
│                                      │
│  On write → rebuild read cache       │
└──────────────────────────────────────┘
        │
        ▼ invalidate + rebuild
┌─ READ (Frontend) ────────────────────┐
│  Redis/MongoDB view:                 │
│  case:{system_name} → {             │
│    name, price, image,              │
│    items: [                         │
│      { name, price, rarity: {       │
│        name, color }, image },      │
│      ...                            │
│    ]                                │
│  }                                  │
│                                      │
│  GET /cases/ → MGET из Redis         │
│  Один запрос, 0 joins                │
└──────────────────────────────────────┘
```

**Как работает:**
1. Admin создаёт/обновляет кейс → write path (MongoDB нормализованные документы)
2. After-write hook → собирает полный view (case + items + rarities) → сохраняет в Redis
3. `GET /cases/` → берёт из Redis (одним MGET), 0 запросов к MongoDB
4. `GET /cases/{name}` → один GET из Redis

**Что это НЕ:** Это не полноценный Event Sourcing. Это просто **read-through cache с денормализацией**. Минимальный CQRS.

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Средняя | **Высокий** — 500 queries → 1 query, page load на порядок быстрее | 1–2 нед. |

---

### 13.5 Event-Driven Architecture (Redis Streams)

**Проблема:** Открытие кейса — это синхронная цепочка с side effects (save win, publish SSE, update stats). Если SSE-публикация упадёт → вся транзакция откатывается? Нет — она просто теряется.

**Текущий flow (синхронный монолит внутри cases):**
```python
# case.py — open case (упрощённо)
item = random_choice(case.items)          # 1. Выбрать предмет
await payment.create_transaction(...)     # 2. HTTP: списать деньги
await inventory.add_item(...)            # 3. MongoDB: добавить в инвентарь
await win_history.save(...)              # 4. MongoDB: сохранить историю
await redis.publish("wins_channel", ...) # 5. Redis: SSE-уведомление
await redis.lpush("recent_wins", ...)    # 6. Redis: лента выигрышей
```

**Решение: Event Bus через Redis Streams (уже есть FastStream в стеке)**

```
┌─ Cases Service ─────────────────┐
│  item = random_choice(...)      │
│  XADD events * type=case_opened │
│          user_id=... item=...   │
│  return item to user            │
└─────────────────────────────────┘
           │
           ▼ Redis Streams
┌──────────────────────────────────────────────┐
│  Stream: events (consumer groups)            │
│                                              │
│  ┌─ payment-consumer ──► create_transaction  │
│  ├─ inventory-consumer ──► add_to_inventory  │
│  ├─ history-consumer ──► save_win_history    │
│  ├─ sse-consumer ──► publish SSE feed        │
│  ├─ stats-consumer ──► update leaderboards   │
│  ├─ referral-consumer ──► credit referrer    │
│  └─ achievement-consumer ──► check & award   │
└──────────────────────────────────────────────┘
```

**Что это даёт:**
- **Decoupling:** Добавление лидербордов, рефералов, достижений → просто новый consumer, без изменений в case.py
- **Resilience:** Consumer упал → сообщения остаются в stream, при рестарте обрабатываются (at-least-once)
- **Async side effects:** SSE, история, статистика — не блокируют ответ юзеру
- **Готовая инфраструктура:** Redis уже есть, FastStream — в зависимостях (но не используется)

**Когда НЕ подходит:** Payment (дебит) должен быть **синхронным** — нельзя вернуть юзеру "ты выиграл X", а деньги списать асинхронно (может не хватить).

**Реалистичный гибрид:**
```
open_case():
    item = roll()
    await payment.debit(user, case.price)  # ← синхронно, до ответа
    await inventory.add(item)              # ← синхронно (или event)
    XADD events case_opened {...}          # ← async side effects
    return item
```

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Средняя | Высокий (extensibility + resilience) | 2–3 нед. |

---

### 13.6 Атомарный Payment endpoint (CheckAndDebit)

**Проблема:** Открытие кейса делает **2 последовательных вызова** к Payment:
1. `GET /balance/{user_id}` → проверка баланса
2. `POST /transaction/{user_id}` → списание

Между ними — TOCTOU race condition (баланс может измениться).

**Решение:** Один атомарный эндпоинт.

```rust
// payment/src/api/balance.rs

/// Атомарная проверка и списание
/// POST /debit { user_id, amount, description, idempotency_key }
/// → 200 { success: true, new_balance, transaction_id }
/// → 402 { success: false, error: "insufficient_funds", balance }
pub async fn check_and_debit(
    State(state): State<AppState>,
    Json(req): Json<DebitRequest>,
) -> Result<Json<DebitResponse>, StatusCode> {
    // MongoDB atomic: findOneAndUpdate с условием balance >= amount
    let result = state.db.collection("balances")
        .find_one_and_update(
            doc! { "user_id": &req.user_id, "balance": { "$gte": req.amount } },
            doc! { "$inc": { "balance": -req.amount } },
            None,
        ).await?;
    
    match result {
        Some(doc) => {
            // Создать запись транзакции
            let txn = create_transaction(...).await?;
            Ok(Json(DebitResponse { success: true, new_balance: ..., transaction_id: txn.id }))
        }
        None => Ok(Json(DebitResponse { success: false, error: "insufficient_funds".into() }))
    }
}
```

**Что это даёт:**
- Открытие кейса: 2 payment hops → **1 hop**
- Убирает race condition (double-spend) из пункта 1.7
- Idempotency key предотвращает дублирование при retry

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Низкая | **Очень высокий** (безопасность + перфоманс) | 2–3 дня |

---

### 13.7 API Gateway Pattern (расширенный Traefik)

**Текущее состояние Traefik:** dumb reverse proxy — только маршрутизация и CORS.

**Что можно добавить без замены Traefik:**

| Возможность | Traefik middleware | Что решает |
|-------------|-------------------|-----------|
| **ForwardAuth** | `forwardAuth` | Централизация auth (п. 13.1) |
| **Rate Limiting** | `rateLimit` | Защита от DDoS/brute-force (п. 2.6) |
| **Circuit Breaker** | `circuitBreaker` | Graceful degradation при падении сервисов |
| **Retry** | `retry` | Автоматический retry при 5xx |
| **Request Size Limit** | `buffering` | Лимит body size (п. 3.9) |
| **Compress** | `compress` | gzip для JSON-ответов |
| **Headers** | `headers` | Security headers (HSTS, X-Frame-Options) |
| **IP Whitelist** | `ipAllowList` | Ограничение доступа к management-панелям |

**Пример конфига (комплексный):**
```yaml
http:
  middlewares:
    # Auth для пользовательских эндпоинтов
    user-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward"
        authResponseHeaders: ["X-User-Id", "X-User-Email", "X-User-Role"]
    
    # Auth для админских эндпоинтов
    admin-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward_admin"
    
    # Rate limiting
    rate-limit:
      rateLimit:
        average: 100
        burst: 200
        period: 1s
    
    # Логин rate limit (строже)
    login-rate-limit:
      rateLimit:
        average: 5
        burst: 10
        period: 60s
    
    # Circuit breaker
    cb:
      circuitBreaker:
        expression: "ResponseCodeRatio(500, 600, 0, 600) > 0.30"
    
    # Лимит размера запроса
    body-limit:
      buffering:
        maxRequestBodyBytes: 1048576  # 1 MB
    
    # Security headers
    security-headers:
      headers:
        frameDeny: true
        contentTypeNosniff: true
        browserXssFilter: true
```

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Низкая | **Высокий** — закрывает 5+ пунктов TODO одной конфигурацией | 1–2 дня |

---

### 13.8 Saga Pattern для сложных транзакций

**Проблема:** Открытие кейса затрагивает 3 сервиса (payment, cases/inventory, cases/history). Если inventory.add() падает после payment.debit() — деньги списаны, предмет не получен.

**Сейчас:** Никакой компенсации нет. Если MongoDB write в inventory/history упадёт — юзер потеряет деньги.

**Решение: Choreography-based Saga**

```
┌─ Шаг 1: Debit ──────────────────────────┐
│  payment.check_and_debit(user, amount)   │
│  → success: transaction_id = X           │
│  → fail: return 402                      │
└──────────────┬───────────────────────────┘
               │ success
               ▼
┌─ Шаг 2: Add to inventory ──────────────┐
│  inventory.add_item(user, item)          │
│  → success: continue                     │
│  → fail: COMPENSATE →                    │
│       payment.refund(transaction_id = X) │
│       return 500                         │
└──────────────┬───────────────────────────┘
               │ success
               ▼
┌─ Шаг 3: Side effects (async) ──────────┐
│  XADD events case_opened {...}           │
│  (win history, SSE, stats — eventual)    │
└──────────────────────────────────────────┘
```

**Ключевое:** Payment должен иметь эндпоинт `POST /refund/{transaction_id}` для компенсации.

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Средняя | Средний (reliability при edge cases) | 1 нед. |

---

### 13.9 Shared Proto / OpenAPI Contract Repository

**Проблема:** Нет контракта между сервисами. Casesservice вызывает paymentservice с JSON body, который может измениться в любой момент — ошибка обнаружится только в runtime.

**Решение A: Proto-first (если gRPC)**
```
backend/
  proto/
    payment.proto
    auth.proto
    user.proto
    cases.proto
  → генерация клиентов для Python (grpcio-tools) и Rust (tonic-build)
```

**Решение B: OpenAPI-first (без gRPC)**
```
backend/
  contracts/
    payment-api.yaml    # OpenAPI 3.1 spec
    auth-api.yaml
    user-api.yaml
  → генерация клиентов: openapi-generator для Python/Rust/TypeScript
  → CI: каждый сервис экспортирует свой spec → diff с контрактом
```

**Что это даёт:**
- Изменение API → CI ломается → разработчик видит breaking change
- Автогенерация клиентского кода (не надо руками писать aiohttp-вызовы)
- Frontend TypeScript types генерируются из того же spec

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Средняя | Средний (DX, reliability) | 2 нед. |

---

### 13.10 Health Check + Readiness/Liveness Probes

**Проблема:** Docker Compose healthcheck только у MongoDB. Traefik опрашивает `/health` у сервисов, но не у всех, и без проверки зависимостей.

**Решение: Трёхуровневые health checks**

```python
# /health — базовый liveness (процесс жив)
@router.get("/health")
async def health():
    return {"status": "ok"}

# /ready — readiness (все зависимости подключены)
@router.get("/ready")
async def ready():
    checks = {
        "mongodb": await check_mongo(),
        "redis": await check_redis(),
    }
    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "ready" if all_ok else "not_ready", "checks": checks}
    )
```

**Docker Compose:**
```yaml
services:
  casesservice:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/ready"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
```

| Сложность | Импакт | Трудозатраты |
|-----------|--------|-------------|
| Низкая | Средний (operational reliability) | 1–2 дня |

---

### Сводная матрица паттернов

| # | Паттерн | Решает проблему | Сложность | Импакт | Трудозатраты |
|---|---------|----------------|-----------|--------|-------------|
| 13.1 | **ForwardAuth** | Auth SPOF, N×hops | Низкая–ср. | **Очень высокий** | 1–2 нед. |
| 13.6 | **Atomic CheckAndDebit** | Race condition, 2 hops | Низкая | **Очень высокий** | 2–3 дня |
| 13.7 | **API Gateway (Traefik расш.)** | Rate limit, CORS, headers | Низкая | **Высокий** | 1–2 дня |
| 13.10 | **Health Probes** | Startup ordering, ops | Низкая | Средний | 1–2 дня |
| 13.3 | **BFF ликвидация** | 655 строк proxy, latency | Низкая–ср. | Средний | 1 нед. |
| 13.4 | **CQRS (light)** | N+1 queries, page load | Средняя | **Высокий** | 1–2 нед. |
| 13.5 | **Event-Driven (Redis Streams)** | Coupling, extensibility | Средняя | Высокий | 2–3 нед. |
| 13.8 | **Saga** | Partial failure, data loss | Средняя | Средний | 1 нед. |
| 13.9 | **Contract Repository** | Breaking changes, DX | Средняя | Средний | 2 нед. |
| 13.2 | **gRPC** | Type safety, binary perf. | Средняя–выс. | Средний | 3–4 нед. |

### Приоритизация

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ФАЗА 1: Quick wins (1–2 недели, максимальный ROI)
  13.6   Атомарный CheckAndDebit       — 2–3 дня
  13.7   Traefik: rate limit + headers  — 1–2 дня
  13.10  Health probes                  — 1–2 дня
  13.1   ForwardAuth                    — 1–2 нед.

ФАЗА 2: Архитектурная оптимизация (2–4 недели)
  13.3   BFF ликвидация (после ForwardAuth)
  13.4   CQRS light (Redis read cache)
  13.8   Saga для case opening

ФАЗА 3: Платформенные инвестиции (1–2 месяца)
  13.5   Event-Driven (Redis Streams consumers)
  13.9   Contract repository (OpenAPI-first)
  13.2   gRPC для payment ↔ cases (опционально)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 14. SSO через существующий Auth + Traefik ForwardAuth (альтернатива Keycloak)

> Можно ли защитить Mongo Express, Redis Commander, Grafana, Kibana, RustFS и другие инфра-сервисы через наш authservice — без добавления Keycloak?

### Короткий ответ: **Да, и это проще и дешевле.**

Keycloak даёт SSO для инфра-панелей "из коробки" через OIDC — но стоит **1.5 GB RAM + PostgreSQL + миграция auth на JWT**. Traefik ForwardAuth + существующий authservice даёт **тот же уровень защиты за 1–2 дня работы и 0 дополнительных ресурсов**.

---

### 14.1 Текущая ситуация

```
┌─ Management-панели (СЕЙЧАС) ─────────────────────────┐
│                                                       │
│  Mongo Express :8081      — admin/admin (дефолт)      │
│  Redis Commander :8082    — БЕЗ аутентификации       │
│  RustFS Console :9001     — rustfsadmin/rustfsadmin   │
│  Traefik Dashboard :8080  — insecure: true           │
│                                                       │
│  Все порты проброшены на хост.                       │
│  Любой с сетевым доступом → полный доступ.           │
│                                                       │
│  ┌─ ПЛАНИРУЕМЫЕ ─────────────────────────────────┐   │
│  │  Grafana :3000       — без auth по умолчанию  │   │
│  │  Kibana :5601        — без auth по умолчанию  │   │
│  │  Prometheus :9090    — без auth по умолчанию  │   │
│  └───────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

**Проблема:** 7 инфра-сервисов × каждый со своей auth = 7 паролей, которые нужно помнить / ротировать / защищать. Или вообще без пароля.

---

### 14.2 Решение: Traefik ForwardAuth + authservice + auth-wall страница

**Архитектура:**

```
Browser                                                          
  │                                                              
  ├─ /panel/mongo-express ──► Traefik                            
  │                              │                               
  │                         ForwardAuth middleware                
  │                              │                               
  │                    GET authservice/verify_forward_admin       
  │                              │                               
  │                    ┌─── 200 OK? ────────────────────┐        
  │                    │         (role == admin)          │        
  │                    │                                  │        
  │                    ▼ YES                    ▼ NO (401) │       
  │               Proxy to                  Redirect to   │       
  │            Mongo Express             /auth-wall.html  │       
  │               :8081                  (login form)     │       
  │                                                       │       
  └───────────────────────────────────────────────────────┘       
```

**Ключевой момент:** Инфра-сервисы **не знают** про CaseHub auth. Traefik проверяет auth **перед** тем как проксировать запрос. Для инфра-сервиса пользователь уже аутентифицирован.

---

### 14.3 Реализация — 4 шага

#### Шаг 1: Убрать пробросы портов (уже в TODO 2.9)

```yaml
# docker-compose.yml — УБРАТЬ прямые порты
services:
  mongo-express:
    # ports:                    # ← УБРАТЬ
    #   - "8081:8081"           # ← доступ только через Traefik
    
  redis-commander:
    # ports:                    # ← УБРАТЬ
    #   - "8082:8081"
    
  rustfs-server:
    # ports:                    # ← УБРАТЬ внешний доступ
    #   - "9001:9001"           # ← консоль только через Traefik
    expose:
      - "9001"                  # ← доступно только в Docker network
```

#### Шаг 2: Эндпоинт `/verify_forward_admin` в authservice

```python
# backend/auth/routes/api.py — новый эндпоинт

@router.get("/verify_forward")
async def verify_forward(request: Request, session_service: FromDishka[SessionService]):
    """Traefik ForwardAuth — проверяет любого авторизованного юзера"""
    sid = request.cookies.get("sid")
    if not sid:
        return Response(status_code=401)
    try:
        session = await session_service.get_session(sid)
        return Response(status_code=200, headers={
            "X-User-Id": str(session.user_id),
            "X-User-Email": session.email,
            "X-User-Role": session.custom_data.get("role", "user"),
        })
    except Exception:
        return Response(status_code=401)

@router.get("/verify_forward_admin")
async def verify_forward_admin(request: Request, session_service: FromDishka[SessionService]):
    """Traefik ForwardAuth — проверяет только admin"""
    sid = request.cookies.get("sid")
    if not sid:
        return Response(status_code=401)
    try:
        session = await session_service.get_session(sid)
        if session.custom_data.get("role") != "admin":
            return Response(status_code=403)
        return Response(status_code=200, headers={
            "X-User-Id": str(session.user_id),
            "X-User-Email": session.email,
            "X-User-Role": "admin",
        })
    except Exception:
        return Response(status_code=401)
```

#### Шаг 3: Traefik middleware + роутеры

```yaml
# traefik/dynamic/services.yml — добавить

http:
  middlewares:
    # ForwardAuth: только admin-юзеры
    admin-forward-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward_admin"
        authResponseHeaders:
          - "X-User-Id"
          - "X-User-Email"
          - "X-User-Role"
        # При 401/403 → браузер получает 401, фронт может показать login
    
    # Для Grafana/Kibana — любой авторизованный юзер (не только admin)
    user-forward-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward"
        authResponseHeaders:
          - "X-User-Id"
          - "X-User-Email"

  routers:
    # ─── Management-панели (admin only) ───
    panel-mongo:
      rule: "PathPrefix(`/panel/mongo`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth, strip-panel-mongo]
      service: mongo-express-svc
    
    panel-redis:
      rule: "PathPrefix(`/panel/redis`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth, strip-panel-redis]
      service: redis-commander-svc
    
    panel-traefik:
      rule: "PathPrefix(`/panel/traefik`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth]
      service: traefik-dashboard-svc

    panel-rustfs:
      rule: "PathPrefix(`/panel/rustfs`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth, strip-panel-rustfs]
      service: rustfs-console-svc
    
    # ─── Мониторинг (Grafana — read-only для всех авторизованных) ───
    panel-grafana:
      rule: "PathPrefix(`/panel/grafana`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth, strip-panel-grafana]
      service: grafana-svc
    
    panel-kibana:
      rule: "PathPrefix(`/panel/kibana`)"
      entryPoints: [web]
      middlewares: [admin-forward-auth, strip-panel-kibana]
      service: kibana-svc

  services:
    mongo-express-svc:
      loadBalancer:
        servers:
          - url: "http://mongo-express:8081"
    
    redis-commander-svc:
      loadBalancer:
        servers:
          - url: "http://redis-commander:8081"
    
    rustfs-console-svc:
      loadBalancer:
        servers:
          - url: "http://rustfs-server:9001"
    
    grafana-svc:
      loadBalancer:
        servers:
          - url: "http://grafana:3000"
    
    kibana-svc:
      loadBalancer:
        servers:
          - url: "http://kibana:5601"
```

#### Шаг 4: Auth-wall страница (опционально, для UX)

При 401 от ForwardAuth — Traefik вернёт 401 браузеру. Варианты:

**Вариант A (простой):** Фронтенд ловит 401 в Navbar/global и показывает "Войдите для доступа к панели".

**Вариант B (auth-wall):** Статическая HTML-страница с редиректом на `/login`:
```yaml
# Traefik custom error page
http:
  middlewares:
    admin-forward-auth:
      forwardAuth:
        address: "http://authservice:8000/verify_forward_admin"
    
    auth-error-redirect:
      errors:
        status: "401-403"
        service: frontend-svc
        query: "/login?redirect={url}"
```

---

### 14.4 Что это закрывает

| Инфра-сервис | Текущий доступ | После ForwardAuth |
|--------------|----------------|--------------------|
| Mongo Express | `admin`/`admin` на :8081 | CaseHub admin login, через `/panel/mongo` |
| Redis Commander | Без пароля на :8082 | CaseHub admin login, через `/panel/redis` |
| RustFS Console | `rustfsadmin`/`rustfsadmin` на :9001 | CaseHub admin login, через `/panel/rustfs` |
| Traefik Dashboard | `insecure: true` на :8080 | CaseHub admin login, через `/panel/traefik` |
| Grafana (будущее) | Default admin на :3000 | CaseHub admin login, через `/panel/grafana` |
| Kibana (будущее) | Без auth на :5601 | CaseHub admin login, через `/panel/kibana` |
| Prometheus (будущее) | Без auth на :9090 | CaseHub admin login, через `/panel/prometheus` |

**Единый логин** → одна сессия CaseHub → доступ ко всему.

---

### 14.5 Сравнение: Auth + ForwardAuth vs Keycloak

| Критерий | Auth + ForwardAuth | Keycloak |
|----------|-------------------|----------|
| **RAM** | 0 MB (уже есть) | +1.5 GB (Keycloak + PostgreSQL) |
| **Трудозатраты** | 1–2 дня | 4–6 недель |
| **Новые зависимости** | 0 | PostgreSQL, Keycloak, keycloak-js |
| **Затрагивает сервисы** | 0 (только Traefik config + 1 эндпоинт в auth) | ВСЕ 5 бэкенд-сервисов + фронтенд |
| **SSO для панелей** | ✅ Через ForwardAuth | ✅ Через OIDC |
| **OAuth (Discord/Yandex)** | ✅ Уже есть (fastapi-sso) | ✅ GUI-конфиг |
| **2FA** | ❌ Нет | ✅ Из коробки |
| **RBAC (roles)** | ✅ Простой (admin/user) | ✅ Полноценный (roles, groups, policies) |
| **JWT токены** | ❌ Cookie-сессии | ✅ Стандарт |
| **Account linking** | ❌ Нет | ✅ Из коробки |
| **Brute-force protection** | ❌ Нет (нужно делать) | ✅ Встроенный |
| **Grafana native SSO** | ⚠️ Auth proxy mode | ✅ OIDC native |
| **Управление юзерами** | ✅ Своя Admin-панель | ✅ Встроенная GUI |

---

### 14.6 Grafana — Auth Proxy Mode (без Keycloak)

Grafana нативно поддерживает **Auth Proxy** — доверяет заголовкам от reverse proxy:

```ini
# grafana.ini
[auth.proxy]
enabled = true
header_name = X-User-Email
header_property = email
auto_sign_up = true
headers = "Name:X-User-Id Role:X-User-Role"

[auth]
disable_login_form = true
```

Traefik ForwardAuth пробрасывает `X-User-Email`, `X-User-Role` → Grafana автоматически создаёт юзера и логинит. **SSO без Keycloak, без OIDC.**

Ограничение: Grafana получает только email и role — полноценного управления ролями через Grafana Admin UI не будет (но admin/viewer mapping через header достаточен).

---

### 14.7 Kibana — аналогичный подход

Kibana Open Source не поддерживает auth proxy нативно, но:

**Вариант A:** Traefik ForwardAuth перед Kibana — закрывает доступ на уровне HTTP. Kibana не знает кто юзер, но доступ есть только у authenticated admin.

**Вариант B:** ReadonlyREST плагин для Elasticsearch/Kibana — поддерживает proxy auth и header-based identity.

**Вариант C:** Если используется OpenSearch вместо Elasticsearch — встроенный Security plugin поддерживает proxy auth.

Для CaseHub достаточно **Варианта A** — Kibana всё равно будет только для внутреннего мониторинга.

---

### 14.8 Когда всё-таки нужен Keycloak

ForwardAuth закрывает **90% потребностей**, но Keycloak становится оправданным когда:

| Ситуация | Почему ForwardAuth не хватит |
|----------|------------------------------|
| **2FA обязателен** | ForwardAuth не добавит TOTP/WebAuthn — нужно писать самому |
| **5+ OAuth-провайдеров** | fastapi-sso поддерживает, но конфиг в коде. Keycloak — через GUI |
| **JWT → убрать auth как SPOF** | ForwardAuth всё равно вызывает auth на каждый запрос. JWT валидируется **локально** |
| **Федерация / enterprise клиенты** | SAML, LDAP, Active Directory integration — только Keycloak |
| **Self-service аккаунт** | Смена пароля, email recovery, account deletion — в Keycloak из коробки |

**Вывод:** На текущем этапе (MVP → early production) ForwardAuth покрывает все нужды. Keycloak имеет смысл рассматривать при масштабировании или если появятся enterprise-клиенты.

---

### 14.9 План реализации

| Шаг | Задача | Трудозатраты |
|-----|--------|-------------|
| 1 | Добавить `/verify_forward` и `/verify_forward_admin` в authservice | 30 мин |
| 2 | Добавить `admin-forward-auth` middleware в Traefik config | 30 мин |
| 3 | Добавить роутеры для Mongo Express, Redis Commander, RustFS, Traefik Dashboard | 1 час |
| 4 | Убрать пробросы портов для management-панелей в docker-compose.yml | 15 мин |
| 5 | Отключить встроенную auth у Mongo Express, Traefik Dashboard (redundant) | 15 мин |
| 6 | (Опционально) Auth-wall redirect страница | 1 час |
| 7 | Тестирование: вход admin → доступ есть, вход user → 403, без логина → 401 | 30 мин |
| **Итого** | | **~3–4 часа** |

При добавлении Grafana/Kibana в будущем:
| Шаг | Задача | Трудозатраты |
|-----|--------|-------------|
| 8 | Добавить Grafana роутер + auth proxy config | 30 мин |
| 9 | Добавить Kibana роутер | 15 мин |
| **Итого доп.** | | **~45 мин** |

---

### 14.10 Итоговая архитектура (целевое состояние)

```
Browser
  │
  ▼
Traefik (:80 / :443)
  │
  ├─── /api/*    ──── без ForwardAuth (или user-level) ──► Микросервисы
  │      ├─ /api/auth/*     → authservice
  │      ├─ /api/user/*     → userservice  
  │      ├─ /api/cases/*    → casesservice
  │      ├─ /api/payment/*  → paymentservice
  │      └─ /api/admin/*    → casesservice (после BFF ликвидации, п. 13.3)
  │
  ├─── /panel/*  ──── admin-forward-auth ──► Инфра-панели
  │      ├─ /panel/mongo    → Mongo Express :8081
  │      ├─ /panel/redis    → Redis Commander :8081
  │      ├─ /panel/rustfs   → RustFS Console :9001
  │      ├─ /panel/traefik  → Traefik API :8080
  │      ├─ /panel/grafana  → Grafana :3000 (auth proxy)
  │      ├─ /panel/kibana   → Kibana :5601
  │      └─ /panel/prom     → Prometheus :9090
  │
  └─── /*        ──── без auth ──► Frontend :5173

Внутренняя сеть Docker (закрыта от хоста):
  ● MongoDB :27017     — нет проброса портов
  ● Redis :6379        — нет проброса портов
  ● Все панели         — нет проброса портов
  ● Все микросервисы   — нет проброса портов
```

**Единая точка входа = Traefik.** Всё остальное — внутренняя сеть. Один логин CaseHub → доступ ко всему.

### Приоритет: **Высокий — 3–4 часа работы, закрывает пункты 2.5 и 2.9 TODO**

```
