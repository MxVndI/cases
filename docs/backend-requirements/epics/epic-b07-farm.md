# Epic B7: Ферма — бэкенд

**Описание:** Серверный бэкенд для мини-игры «Ферма» (кликер). Состоит из двух компонентов:

1. **Cases Service (farm/sync, farm/claim):** Серверное хранение прогресса фермы в Redis (авто-кликер уровень, скорость, pending монеты, last_sync). Расчёт offline-заработка на сервере при синхронизации (на основе auto_clicker_level, auto_clicker_speed_level и elapsed time). Claim переводит накопленные монеты на баланс через Payment Service. Лимит pending: 1000 CHC.

2. **Payment Service (tap, daily bonus):** Tap-эндпоинт принимает клики с фронтенда и создаёт транзакции system→user. Rate limiting: 10 tap/сек на пользователя (Redis INCR + EXPIRE). Ежедневный бонус: 100 CHC, cooldown 24 часа (Redis SET_EX). Оба эндпоинта аутентифицируют пользователя через cookie sid → Auth Service verify_user.

**Роли:** Пользователь  
**Связанные маршруты:** /api/cases/farm/*, /api/payment/tap, /api/payment/bonus/daily  
**Зависимости:** Epic B4: Payment Service — для начисления монет на основной баланс; Epic B1: Auth — для верификации сессии

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-7.1 | Серверная синхронизация фермы (sync/claim) | [b-us-7.1.md](../user-stories/b-us-7.1.md) |
| B-US-7.2 | Tap-эндпоинт (кликер) | [b-us-7.2.md](../user-stories/b-us-7.2.md) |
| B-US-7.3 | Ежедневный бонус | [b-us-7.3.md](../user-stories/b-us-7.3.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-7.1 | Синхронизация прогресса фермы | [b-uc-7.1.md](../use-cases/b-uc-7.1.md) |
| B-UC-7.2 | Tap и ежедневный бонус | [b-uc-7.2.md](../use-cases/b-uc-7.2.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B7.1.01 | Реализовать хранение FarmState в Redis (JSON: auto_clicker_level, auto_clicker_speed_level, pending, last_sync) | B-US-7.1 |
| TASK-B7.1.02 | Реализовать эндпоинт POST /farm/sync (принять уровни, рассчитать offline-доход, обновить state) | B-US-7.1 |
| TASK-B7.1.03 | Реализовать расчёт offline-заработка (_compute_offline: elapsed * rate_per_sec, cap 1000) | B-US-7.1 |
| TASK-B7.1.04 | Реализовать эндпоинт POST /farm/claim (перевести pending на баланс через Payment Service) | B-US-7.1 |
| TASK-B7.1.05 | Проверять статус пользователя (blocked → 403) | B-US-7.1 |
| TASK-B7.2.01 | Реализовать эндпоинт POST /tap (Rust/Axum, Payment Service) | B-US-7.2 |
| TASK-B7.2.02 | Аутентификация через cookie sid → Auth Service /verify_user/{ssid} | B-US-7.2 |
| TASK-B7.2.03 | Rate limiting: 10 tap/сек на пользователя (Redis INCR + EXPIRE 1s) | B-US-7.2 |
| TASK-B7.2.04 | Создание транзакции system→user (CHC) | B-US-7.2 |
| TASK-B7.3.01 | Реализовать эндпоинт POST /bonus/daily (100 CHC, cooldown 24ч в Redis) | B-US-7.3 |
