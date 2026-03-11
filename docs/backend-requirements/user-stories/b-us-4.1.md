# B-US-4.1: Управление балансом

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу видеть свой баланс и иметь надёжную систему начисления/списания средств.

## Описание

> **Фактическая реализация:**  
> Баланс **не является полем модели User**. Он управляется отдельным **Payment Service** (Rust/Axum, собственная БД MongoDB).  
>
> Реализованные эндпоинты:
> - `GET /balance/{user_id}` — получить текущий баланс
> - `POST /transaction/{user_id}` — создать транзакцию (начисление/списание)
> - `GET /transaction/{user_id}` — история транзакций пользователя
>
> Валюты: RUB, USD, EUR. Системный аккаунт (UUID nil) — не требует проверки баланса.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B4.1.01](../tasks/task-b4.1.01.md) | ~~Добавить поле balance в модель User~~ (вынесено в Payment Service) |
| [TASK-B4.1.02](../tasks/task-b4.1.02.md) | ~~GET /users/me/balance~~ → Payment Service: GET /balance/{user_id} |
| [TASK-B4.1.03](../tasks/task-b4.1.03.md) | ~~Сервис начисления/списания~~ → Payment Service: POST /transaction/{user_id} |
| [TASK-B4.1.04](../tasks/task-b4.1.04.md) | ~~Атомарность (MongoDB)~~ → Payment Service обеспечивает атомарность |
