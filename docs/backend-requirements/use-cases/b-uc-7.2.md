# B-UC-7.2: Tap и ежедневный бонус

**Эпик:** [Epic B7: Ферма — бэкенд](../epics/epic-b07-farm.md)

## Акторы
- Авторизованный пользователь

## Предусловия
- Пользователь авторизован (cookie `sid`)

## Основной сценарий: Tap (клик)

1. Пользователь отправляет `POST /tap` с `{amount: N}` (Payment Service)
2. Система извлекает `sid` из cookie, верифицирует через Auth Service (`/verify_user/{ssid}`)
3. Система проверяет rate limit: Redis INCR `tap:{user_id}` с EXPIRE 1 секунда
4. Если count > 10 → 429 Too Many Requests
5. Система создаёт транзакцию: system (UUID nil) → user, amount N, currency CHC, описание "Фарм"
6. Возвращает `{success: true}`

## Альтернативный сценарий: Ежедневный бонус

1. Пользователь отправляет `POST /bonus/daily` (Payment Service)
2. Система верифицирует пользователя через cookie sid → Auth Service
3. Система проверяет Redis ключ `daily_bonus:{user_id}`
4. Если ключ существует → `{success: false, message: "Бонус уже получен сегодня"}`
5. Если ключ не существует:
   - Создаёт транзакцию: system → user, 100 CHC, описание "Ежедневный бонус"
   - Устанавливает Redis ключ с TTL 86400 сек (24 часа)
   - Возвращает `{success: true, amount: 100}`

## Исключения
- Невалидная/отсутствующая сессия → 401
- Rate limit exceeded → 429
- Ошибка транзакции → 500

## Постусловия
- Баланс пользователя увеличен на сумму tap/бонуса
- Rate limit и cooldown обновлены в Redis

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-7.2](sequences.md)
