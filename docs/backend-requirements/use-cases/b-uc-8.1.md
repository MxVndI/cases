# B-UC-8.1: Доступ администратора к управляющему UI через AML

**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)

## Описание

Администратор открывает AML-страницу, выбирает нужный управляющий UI (mongo-express или redis-commander) и получает к нему прозрачный доступ через прокси без необходимости знать реальные учётные данные.

## Акторы

- **Первичный:** Администратор
- **Система:** AML Service, Auth Service, mongo-express / redis-commander, Redis, MongoDB (`aml_db`)

## Предусловия

- Администратор аутентифицирован в системе (наличие cookie `sid`)
- TargetSystem и Mapping для данного администратора созданы (или будут созданы через авто-bootstrap)
- Переменные окружения: `AML_KEK_B64`, `MONGO_EXPRESS_USER/PASSWORD`, `REDIS_COMMANDER_HTTP_USER/PASSWORD`

## Основной сценарий

1. Администратор открывает `GET /aml` (браузер отправляет cookie `sid`)
2. AML вызывает Auth Service (`GET /verify_user/{sid}?token=…`) для получения `admin_id`
3. AML находит активные маппинги для `admin_id` в MongoDB (`aml_db`)
4. Если маппинги существуют — возвращает HTML-страницу с карточками таргетов
5. Администратор кликает на карточку → браузер открывает `/aml/proxy/{target_id}/`
6. AML проверяет sid, находит маппинг, расшифровывает credentials через SecretService (KEK из env → DEK → plaintext)
7. AML проверяет Redis (`aml:upstream:{admin_id}:{target_id}`) на наличие upstream cookies
8. AML проксирует запрос к `target.endpoint/{path}`: подставляет upstream cookies, фильтрует hop-by-hop заголовки
9. Если upstream вернул `Set-Cookie` — AML сохраняет их в Redis (TTL 3600 сек)
10. AML возвращает ответ upstream-сервиса администратору
11. AuditService записывает `AuditEvent` (`proxy_access`) в `aml_db`

## Постусловия

- Администратор видит интерфейс mongo-express или redis-commander
- В `aml_db.AuditEvent` появилась запись о доступе
- Upstream cookies сохранены в Redis

## Альтернативные сценарии

1. **sid отсутствует или невалиден** → Auth Service возвращает не-200 → AML возвращает 401
2. **Маппинг для данного target_id не найден** → 403 `No access to target`
3. **TargetSystem disabled или не найден** → 404 `Target not found`
4. **Auth Service недоступен** → 503 `Auth service unavailable`
5. **Upstream сервис недоступен** → aiohttp выбрасывает исключение → 502/503

## Связанные User Stories

- [B-US-8.1](../user-stories/b-us-8.1.md)
- [B-US-8.3](../user-stories/b-us-8.3.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-8.1](sequences.md)
