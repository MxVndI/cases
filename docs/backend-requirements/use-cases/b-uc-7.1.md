# B-UC-7.1: Синхронизация прогресса фермы

**Эпик:** [Epic B7: Ферма — бэкенд](../epics/epic-b07-farm.md)

## Описание

Синхронизация прогресса фермы и вывод накопленных монет (CHC) на баланс. Реализовано в Cases Service (роутер farm). Состояние хранится в Redis hash `farm:{user_id}`.

## Акторы

- **Первичный:** Пользователь
- **Система:** Cases Service (farm router), Payment Service

## Предусловия

- Пользователь авторизован (cookie `sid`)
- Пользователь не заблокирован

## Состояние фермы (Redis key `farm:{user_id}`)

| Поле | Тип | Описание |
|-------|------|----------|
| `auto_clicker_level` | int | Уровень авто-кликера |
| `auto_clicker_speed_level` | int | Уровень скорости авто-кликера |
| `pending` | int | Накопленные монеты (макс 1000) |
| `last_sync` | float | timestamp последней синхронизации |

## Основной сценарий — Синхронизация (POST /farm/sync)

1. Фронтенд периодически отправляет `POST /farm/sync` с cookie `sid` и телом:
   ```json
   {"auto_clicker_level": 3, "auto_clicker_speed_level": 1}
   ```
2. Cases Service аутентифицирует пользователя через Auth Service
3. Проверяется статус пользователя (если `blocked` → 403)
4. Загружается состояние из Redis (`farm:{user_id}`)
5. Вычисляется offline-заработок на основе **старых** уровней и `elapsed` времени (кап: 1000 CHC)
6. Сохраняется обновлённое состояние с **новыми** уровнями из клиента
7. Возвращается `FarmSyncResponse`: `{pending, auto_clicker_level, auto_clicker_speed_level, offline_earned}`

## Дополнительный сценарий — Вывод монет (POST /farm/claim)

1. Пользователь нажимает «Собрать» — фронтенд отправляет `POST /farm/claim` с cookie `sid`
2. Аутентификация + проверка статуса
3. Загружается состояние из Redis, вычисляется оффлайн-заработок
4. Общая сумма (`pending + offline`, кап 1000) переводится на баланс через Payment Service: `POST /transaction/{user_id}` (транзакция `system → user`, описание «Фарм: авто-кликер»)
5. `pending` сбрасывается в 0, `last_sync` обновляется
6. Возвращается `FarmClaimResponse`: `{claimed, success}`

## Конфигурация

- `OFFLINE_FARM_CAP = 1000` — максимальное накопление pending (CHC)
- `AUTO_CLICK_INTERVALS = [1000, 750, 500, 333, 250]` — интервалы авто-кликера (мс) по уровням скорости
- `SYSTEM_UUID = UUID(int=0)` — системный аккаунт для транзакций

## Постусловия

- **sync:** Прогресс фермы синхронизирован, offline-заработок учтён
- **claim:** Накопленные монеты переведены на баланс (CHC)

## Альтернативные сценарии

1. **Невалидная сессия** → 401
2. **Пользователь заблокирован** → 403
3. **Нет состояния в Redis** (sync) → создаётся default state (`pending=0`)
4. **Нет состояния в Redis** (claim) → `{claimed: 0, success: true}`
5. **Ошибка Payment Service** при claim → 500
6. **pending == 0** при claim → `{claimed: 0, success: true}`

## Связанные User Stories

- [B-US-7.1](../user-stories/b-us-7.1.md)
- [B-US-7.2](../user-stories/b-us-7.2.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-7.1](sequences.md)
