# B-US-4.1: Управление балансом (Payment Service)

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)  
**Роль:** Пользователь / Система

## User Story

Как пользователь, я хочу видеть свой баланс в CHC и историю транзакций, а как система — иметь надёжный механизм начисления и списания средств.

## Описание

Баланс управляется отдельным **Payment Service** (Rust/Axum), работающим с собственной MongoDB и Redis.

**Валюта:** CHC (CaseHubCoin) — единственная валюта платформы (enum `Currency::CHC`).

**Модель данных:**

- `Wallet` — `{ balances: HashMap<String, f64> }` (ключ — название валюты, значение — сумма)
- `GetBalance` — `{ wallet: Wallet }` (ответ: `wallet.balances.CHC`)
- `Transaction` — `{ from: UUID, to: UUID, currency: Currency, amount: f64, status: String, timestamp: DateTime }`
- `CreateTransaction` — `{ currency: Currency, amount: f64, to: UUID, description: Option<String> }`
- **Системный аккаунт** — `UUID::nil()` (00000000-0000-0000-0000-000000000000); не требует проверки баланса при списании

**Реализованные эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/balance/{user_id}` | Текущий баланс пользователя (`GetBalance`) |
| POST | `/transaction/{user_id}` | Создать транзакцию (начисление/списание) |
| GET | `/transaction/{user_id}` | История транзакций пользователя |
| GET | `/health` | Health-check |

Swagger UI доступен на `/docs`.

Payment Service вызывается из других сервисов (Cases, Admin) по внутренней сети для начисления выигрышей, продажи предметов и сбора монет фермы.

## Критерии приёмки

- `GET /balance/{user_id}` возвращает `{ wallet: { balances: { "CHC": <number> } } }`
- `POST /transaction/{user_id}` создаёт атомарную транзакцию; обновляет балансы from и to
- Системный UUID (`nil`) не проверяется на достаточность средств
- `GET /transaction/{user_id}` возвращает список транзакций с from, to, amount, currency, status, timestamp

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B4.1.01](../tasks/task-b4.1.01.md) | Payment Service: модели Wallet, Transaction, Balance (Rust/MongoDB) |
| [TASK-B4.1.02](../tasks/task-b4.1.02.md) | Эндпоинт GET /balance/{user_id} — получение текущего баланса CHC |
| [TASK-B4.1.03](../tasks/task-b4.1.03.md) | Эндпоинт POST /transaction/{user_id} — создание транзакции с атомарным обновлением балансов |
| [TASK-B4.1.04](../tasks/task-b4.1.04.md) | Эндпоинт GET /transaction/{user_id} — история транзакций пользователя |
