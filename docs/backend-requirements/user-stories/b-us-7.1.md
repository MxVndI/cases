# B-US-7.1: Серверная синхронизация фермы (sync/claim)

**Эпик:** [Epic B7: Ферма — бэкенд](../epics/epic-b07-farm.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу, чтобы прогресс фермы синхронизировался с сервером, а накопленные монеты можно было перевести на основной баланс.

## Описание

Ферма реализована в **Cases Service** (Python/FastAPI) через роутер `/farm/`. Состояние хранится в **Redis** (ключ `farm:{user_id}`), а зачисление монет — через **Payment Service**.

**Конфигурация:**

- `OFFLINE_FARM_CAP = 1000` — максимум накопленных монет
- `AUTO_CLICK_INTERVALS = [1000, 750, 500, 333, 250]` мс — скорость авто-кликера по уровням
- `SYSTEM_UUID = UUID(int=0)` — системный аккаунт для начислений

**Реализованные эндпоинты:**

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| POST | `/farm/sync` | Синхронизация состояния фермы | Cookie `sid` → Auth Service |
| POST | `/farm/claim` | Сбор накопленных монет на баланс | Cookie `sid` → Auth Service |

**POST /farm/sync** — принимает `FarmSyncRequest`:

- `auto_clicker_level: int` — уровень авто-кликера
- `auto_clicker_speed_level: int` — уровень скорости

Логика:

1. Авторизация по cookie `sid`; проверка блокировки через User Service
2. Чтение текущего состояния из Redis (`farm:{user_id}`)
3. Расчёт офлайн-заработка: `elapsed × auto_clicker_level × (1000 / interval_ms)` с учётом cap
4. Сохранение нового состояния (уровни из запроса, обновлённый pending, timestamp)
5. Возвращает `FarmSyncResponse`: `pending`, `auto_clicker_level`, `auto_clicker_speed_level`, `offline_earned`

**POST /farm/claim** — без тела запроса:

1. Авторизация и проверка блокировки
2. Чтение состояния из Redis; расчёт офлайн-заработка
3. Создание транзакции `system → user` через Payment Service (описание: «Фарм: авто-кликер»)
4. Обнуление `pending`, обновление `last_sync`
5. Возвращает `FarmClaimResponse`: `claimed: int`, `success: bool`

## Критерии приёмки

- `/farm/sync` сохраняет уровни и рассчитывает офлайн-заработок с учётом `OFFLINE_FARM_CAP`
- `/farm/claim` переводит все накопленные монеты на баланс CHC через Payment Service
- После claim `pending` обнуляется
- Заблокированный пользователь получает `403`
- Без авторизации (cookie `sid`) — `401`
- Ошибка Payment Service при claim — `500`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B7.1.01](../tasks/task-b7.1.01.md) | Хранение состояния фермы в Redis (ключ farm:{user_id}, JSON) |
| [TASK-B7.1.02](../tasks/task-b7.1.02.md) | Эндпоинт POST /farm/sync — синхронизация уровней и расчёт офлайн-заработка |
| [TASK-B7.1.03](../tasks/task-b7.1.03.md) | Эндпоинт POST /farm/claim — сбор монет с транзакцией system→user |
| [TASK-B7.1.04](../tasks/task-b7.1.04.md) | Античит: cap на максимальный pending (OFFLINE_FARM_CAP=1000) |
