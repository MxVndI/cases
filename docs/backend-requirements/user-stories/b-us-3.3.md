# B-US-3.3: Открытие кейса (игровая логика)

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу открывать кейсы и получать случайные предметы.

## Описание

Cases Service реализует полный флоу открытия кейса через `POST /cases/{case_id}/open` (cookie auth через sid → Auth /verify_user). Также доступны `POST /cases/open-by-name/{name}` и `POST /cases/open-by-system-name/{system_name}`.

Алгоритм: проверка баланса пользователя → **взвешенный случайный выбор** предмета из case_content (каждый предмет имеет drop_chance) → создание транзакции user→system через **Payment Service** (списание стоимости кейса в CHC) → запись в **WinHistory** → добавление в **Redis recent_wins** → публикация в **SSE wins_channel** → добавление предмета в **Inventory** → возврат выпавшего предмета.

## Критерии приёмки

- POST /cases/{case_id}/open — открытие кейса по ID (cookie auth)
- POST /cases/open-by-name/{name} — открытие по name
- POST /cases/open-by-system-name/{system_name} — открытие по system_name
- Взвешенный случайный выбор на основе drop_chance из case_content
- Проверка баланса CHC через Payment Service перед открытием
- Создание транзакции user→system через Payment Service
- Запись в WinHistory
- Обновление Redis recent_wins
- Публикация выигрыша в SSE wins_channel
- Добавление предмета в Inventory
- Возврат выпавшего предмета в ответе

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B3.3.01](../tasks/task-b3.3.01.md) | Реализовать POST /cases/{case_id}/open (cookie auth) |
| [TASK-B3.3.02](../tasks/task-b3.3.02.md) | Реализовать POST /cases/open-by-name/{name} и open-by-system-name/{system_name} |
| [TASK-B3.3.03](../tasks/task-b3.3.03.md) | Реализовать алгоритм взвешенного случайного выбора (drop_chance) |
| [TASK-B3.3.04](../tasks/task-b3.3.04.md) | Проверять баланс CHC и списать стоимость через Payment Service |
| [TASK-B3.3.05](../tasks/task-b3.3.05.md) | Записать выигрыш в WinHistory и Redis recent_wins |
| [TASK-B3.3.06](../tasks/task-b3.3.06.md) | Опубликовать в SSE wins_channel |
| [TASK-B3.3.07](../tasks/task-b3.3.07.md) | Добавить предмет в Inventory и вернуть результат |
