# B-US-7.2: Tap-эндпоинт (кликер)

**Эпик:** [Epic B7: Ферма — бэкенд](../epics/epic-b07-farm.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу зарабатывать CHC нажатиями (тапами) в кликере с защитой от злоупотреблений.

## Описание

Tap-эндпоинт реализован в **Payment Service** (Rust/Axum) — `POST /tap`. Создаёт транзакцию начисления CHC при каждом нажатии с rate-limiting через Redis.

**Запрос** — `TapRequest`:

- `amount: f64` — сумма за тап (положительное = system→user, отрицательное = user→system)
- Максимум `MAX_TAP_AMOUNT = 100_000` за один тап; `amount == 0` → `400`

**Ответ** — `TapResponse`:

- `success: bool`
- `message: String`
- `transaction_id: Option<Uuid>`

**Авторизация:**

1. Извлечение `sid` из HTTP-заголовка `Cookie` (парсинг `sid=...`)
2. Верификация через Auth Service: `GET {AUTH_SERVICE_URL}/verify_user/{sid}?token={TOKEN}`
3. Получение `uid` из ответа Auth Service
4. Без cookie или при невалидном sid → `401 Unauthorized`

**Rate Limiting (Redis):**

- Ключ: `tap:{user_id}`
- INCR + EXPIRE 1 секунда
- Лимит: `MAX_TAPS_PER_SECOND = 10`
- Превышение → `429 Too Many Requests`

**Логика транзакции:**

- `amount > 0` → транзакция `UUID::nil() → user_id` (system начисляет)
- `amount < 0` → транзакция `user_id → UUID::nil()` (user тратит)
- Валюта: `Currency::CHC`
- Описание: «Фарм»
- Создание через `TransactionManager::create`

## Критерии приёмки

- `POST /tap` с валидным cookie `sid` и `amount > 0` создаёт транзакцию и возвращает `success: true`
- Без cookie `sid` → `401`
- `amount == 0` или `|amount| > 100_000` → `400`
- Более 10 запросов в секунду от одного пользователя → `429`
- Ошибка создания транзакции → `500`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B7.2.01](../tasks/task-b7.2.01.md) | Эндпоинт POST /tap — создание транзакции из тапа (Rust/Axum) |
| [TASK-B7.2.02](../tasks/task-b7.2.02.md) | Авторизация через cookie sid → Auth Service /verify_user/{sid} |
| [TASK-B7.2.03](../tasks/task-b7.2.03.md) | Rate limiting: Redis INCR tap:{user_id}, max 10/sec, EXPIRE 1s |
