# B-US-3.4: Последние выигрыши и SSE-лента

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**Роль:** Гость / Пользователь

## User Story

Как гость, я хочу видеть ленту последних выигрышей в реальном времени, а как авторизованный пользователь — свою персональную историю и статистику побед.

## Описание

Cases Service (Python/FastAPI) реализует систему отображения выигрышей через несколько эндпоинтов:

**1. SSE-лента реального времени** — `GET /wins/stream`

- Подписка на Redis Pub/Sub канал `wins_channel`
- Возвращает `StreamingResponse` с `media_type="text/event-stream"`
- При подключении отправляет `: connected`, затем события `data: {...}`
- Keepalive-сообщения (`: keepalive`) при отсутствии данных (timeout 15 сек)
- Корректная отписка при отключении клиента
- Заголовки: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`

**2. Последние выигрыши из кэша** — `GET /recent_wins`

- Читает из Redis List `recent_wins` (LRANGE 0..limit-1)
- Параметр `limit` (query, default=20, max=50)
- Обогащает данные: дозагружает `item_img_url` из каталога Item и `user_nickname` из User Service
- Публичный эндпоинт, авторизация не требуется

**3. Мои выигрыши** — `GET /wins/my` (авторизация по cookie `sid`)

- Возвращает историю из MongoDB-коллекции `WinHistory` для текущего пользователя
- Параметры: `limit` (default=50, max=200), `offset` (default=0)
- Сортировка по `timestamp` (desc)

**4. Статистика побед** — `GET /wins/my/stats` (авторизация по cookie `sid`)

- Возвращает общее количество побед и последние 3 записи

## Критерии приёмки

- SSE-соединение на `/wins/stream` остаётся открытым; новые выигрыши доставляются через pub/sub
- `/recent_wins` возвращает до 50 последних записей с `item_img_url` и `user_nickname`
- `/wins/my` требует cookie `sid`, возвращает 401 без авторизации
- `/wins/my/stats` возвращает `total` и список `recent`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B3.4.01](../tasks/task-b3.4.01.md) | Реализовать SSE-эндпоинт GET /wins/stream (Redis Pub/Sub wins_channel) |
| [TASK-B3.4.02](../tasks/task-b3.4.02.md) | Реализовать GET /recent_wins — чтение из Redis List recent_wins с обогащением данных |
| [TASK-B3.4.03](../tasks/task-b3.4.03.md) | Реализовать GET /wins/my — персональная история побед из WinHistory (MongoDB) |
| [TASK-B3.4.04](../tasks/task-b3.4.04.md) | Реализовать GET /wins/my/stats — статистика побед пользователя |
