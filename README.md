<div align="center">

# CaseHub

**Симулятор открытия кейсов CS2**

[![Docs](https://img.shields.io/badge/docs-mxvndi.github.io%2Fcases-blue)](https://mxvndi.github.io/cases/docs)

Учебный проект по дисциплине «Командная разработка ПО»

</div>

---

## О проекте

CaseHub — веб-платформа для симуляции открытия кейсов в стиле CS2. Пользователи могут просматривать кейсы, открывать их, получать предметы с разными редкостями, управлять инвентарём и отслеживать историю выигрышей.

## Стек технологий

### Frontend
| Технология | Назначение |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Сборка |
| TanStack Router / Query | Маршрутизация и data-fetching |
| Tailwind CSS v4 + shadcn/ui | Стилизация |
| Framer Motion + GSAP | Анимации |

### Backend
| Технология | Назначение |
|---|---|
| FastAPI + Uvicorn | HTTP-сервисы (Python) |
| Axum + Tokio | Payment-сервис (Rust) |
| Beanie + Motor | Async ODM для MongoDB |
| FastStream | Redis Pub/Sub |
| Dishka | Dependency Injection |
| fastapi-sso | OAuth (Discord, Yandex) |

### Инфраструктура
| Компонент | Назначение |
|---|---|
| MongoDB 8.0 | Основная БД |
| Redis 8.4 | Сессии, кэш, pub/sub |
| Traefik v3 | API Gateway / Reverse Proxy |
| RustFS | S3-совместимое хранилище файлов |
| Prometheus + Grafana + Loki | Мониторинг и логи |

## Архитектура

```
                        ┌─────────────┐
                        │   Traefik   │  :80
                        │  (Gateway)  │
                        └──────┬──────┘
           ┌──────────┬────────┼────────┬──────────┐
           ▼          ▼        ▼        ▼          ▼
      /api/auth  /api/user /api/cases /api/admin /api/payment
           │          │        │        │          │
      ┌────┴───┐ ┌────┴──┐ ┌──┴────┐ ┌─┴─────┐ ┌─┴──────┐
      │  Auth  │ │ User  │ │ Cases │ │ Admin │ │Payment │
      │ :8000  │ │ :8002 │ │ :8001 │ │ :7777 │ │ :8003  │
      │Python  │ │Python │ │Python │ │Python │ │  Rust  │
      └───┬────┘ └───┬───┘ └──┬────┘ └───┬───┘ └───┬────┘
          │          │        │           │          │
          └──────────┴────────┼───────────┴──────────┘
                              │
                    ┌─────────┴──────────┐
                    │  MongoDB  │  Redis  │
                    └─────────────────────┘
```

### Сервисы

| Сервис | Порт | Ответственность |
|--------|------|----------------|
| **auth** | 8000 | Регистрация, вход, OAuth (Discord/Yandex), сессии |
| **user** | 8002 | Профили, предпочтения, избранное |
| **cases** | 8001 | Кейсы, предметы, редкости, фарм, инвентарь |
| **admin** | 7777 | Управление контентом, загрузка изображений в RustFS |
| **payment** | 8003 | Баланс, пополнение, история транзакций |

## Функционал

- **Открытие кейсов** — анимация с системой вероятностей по редкостям
- **Инвентарь** — хранение и просмотр полученных предметов
- **Фарм** — пассивное получение игровой валюты
- **Баланс** — пополнение и управление счётом
- **Лента выигрышей** — real-time лента последних открытий всех игроков
- **Профили** — история открытий, публичные страницы пользователей
- **Авторизация** — email (OTP)
- **Админ-панель** — управление кейсами, предметами и пользователями

## Быстрый старт

### Требования
- Docker + Docker Compose
- Node.js 20+ (для локальной разработки frontend)

### Запуск

1. Склонируй репозиторий:
   ```bash
   git clone https://github.com/MxVndI/cases.git
   cd cases
   ```

2. Создай `.env` файл на основе [DEPLOY_SECRETS_CHECKLIST.md](DEPLOY_SECRETS_CHECKLIST.md) и `.env.example` каждого сервиса.

3. Запусти все сервисы:
   ```bash
   docker compose up -d
   ```

### Адреса сервисов после запуска

| Сервис | URL |
|--------|-----|
| Приложение | http://localhost:5173 |
| Traefik Dashboard | http://localhost:8080 |
| Mailpit (dev SMTP) | http://localhost:8025 |
| RustFS Console | http://localhost:9001 |

> Mongo Express и Redis Commander доступны только через AML-прокси (не экспонируются напрямую).

### Локальная разработка frontend

```bash
cd frontend
npm install
npm run dev
```

### Переменные окружения

Каждый сервис содержит `.env.example` с описанием всех переменных. Основные:

| Переменная | Описание |
|---|---|
| `MONGODB_URL` | Строка подключения к MongoDB |
| `REDIS_URL` | Строка подключения к Redis |
| `VITE_API_BASE_URL` | URL API для frontend |
| `SMTP_SERVER`, `EMAIL_ADDRESS`, `EMAIL_PASSWORD` | Настройки почты |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | Доступ к файловому хранилищу |

## Структура репозитория

```
cases/
├── frontend/          # React-приложение
├── backend/
│   ├── auth/          # Сервис аутентификации (Python)
│   ├── user/          # Сервис пользователей (Python)
│   ├── cases/         # Сервис кейсов (Python)
│   ├── admin/         # Административный сервис (Python)
│   ├── payment/       # Платёжный сервис (Rust)
│   └── aml/           # Access Management Layer — прокси для защиты dev-инструментов
├── infra/             # Конфигурации Grafana, Loki, Prometheus, Promtail
├── traefik/           # Конфигурация API Gateway
├── docs/              # Документация проекта
├── docker-compose.yml
└── mongo-init.js      # Инициализация MongoDB (superadmin)
```
