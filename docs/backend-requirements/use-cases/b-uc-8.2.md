# B-UC-8.2: Bootstrap маппингов при первом входе

**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)

## Описание

При первом обращении администратора к `GET /aml`, если у него нет ни одного маппинга, AML автоматически создаёт TargetSystem-записи для mongo-express и redis-commander, шифрует credentials из переменных окружения и создаёт маппинги.

## Акторы

- **Первичный:** Администратор (инициирует косвенно через GET /aml)
- **Вторичный:** DevOps (задал env-переменные при деплое)
- **Система:** AML Service, MongoDB (`aml_db`)

## Предусловия

- Администратор аутентифицирован (sid-cookie валиден)
- У администратора нет активных маппингов в `aml_db`
- Переменные окружения заданы: `MONGO_EXPRESS_USER`, `MONGO_EXPRESS_PASSWORD`, `REDIS_COMMANDER_HTTP_USER`, `REDIS_COMMANDER_HTTP_PASSWORD`, `AML_KEK_B64`

## Основной сценарий

1. `GET /aml` — AML получает `admin_id`, запрашивает маппинги из MongoDB — список пустой
2. AML вызывает `bootstrap_for_admin(admin_id, settings)`
3. Bootstrap проверяет, существует ли TargetSystem `mongo-express` (`type=mongo`) — если нет, создаёт
4. Bootstrap проверяет, существует ли TargetSystem `redis-commander` (`type=redis`) — если нет, создаёт
5. Для `mongo-express`: проверяет наличие Mapping для `admin_id` → если нет, шифрует `MONGO_EXPRESS_USER/PASSWORD` → создаёт `EncryptedBlob` → создаёт `Mapping`
6. Для `redis-commander`: аналогично с `REDIS_COMMANDER_HTTP_USER/PASSWORD`
7. Bootstrap завершается → AML повторно запрашивает маппинги → возвращает HTML с двумя карточками

## Постусловия

- В `aml_db`: созданы 2 TargetSystem, 2 EncryptedBlob, 2 Mapping для данного `admin_id`
- Plaintext credentials нигде не сохранён
- Администратор видит HTML-страницу с карточками mongo-express и redis-commander

## Альтернативные сценарии

1. **Отсутствует env-переменная** (напр. `MONGO_EXPRESS_USER` пуст) → bootstrap выбрасывает `HTTPException(500, "Missing MONGO_EXPRESS_USER env")` → UI возвращает страницу с сообщением об ошибке
2. **KEK не задан или некорректен** → `CryptoConfigError` → `HTTPException(500)` → bootstrap не создаёт маппинги
3. **TargetSystem уже существует** → bootstrap пропускает создание, переходит к проверке Mapping
4. **Mapping уже существует** → bootstrap пропускает его создание (идемпотентность)
5. **Вызов `POST /aml/bootstrap`** (явный) — поведение аналогично авто-bootstrap, доступен аутентифицированному администратору

## Связанные User Stories

- [B-US-8.1](../user-stories/b-us-8.1.md)
- [B-US-8.2](../user-stories/b-us-8.2.md)
- [B-US-8.3](../user-stories/b-us-8.3.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-8.2](sequences.md)
