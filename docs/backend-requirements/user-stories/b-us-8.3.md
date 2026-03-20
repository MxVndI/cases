# B-US-8.3: Безопасное хранение учётных данных (envelope encryption)

**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу хранить учётные данные для управляющих UI в зашифрованном виде, чтобы компрометация базы данных не раскрывала пароли.

## Описание

**Envelope encryption** (двухуровневое шифрование):
- **KEK** (Key Encryption Key) — 32-байтный мастер-ключ, хранится только в env (`AML_KEK_B64`), никогда не попадает в БД
- **DEK** (Data Encryption Key) — генерируется случайно для каждого credential, шифруется KEK (AES-256-GCM), результат записывается в БД
- **Поля username и password** — шифруются отдельными AES-256-GCM операциями с DEK

**EncryptedBlob** (Beanie Document, `aml_db`):
- `alg: "AES-256-GCM"`, `key_version: 1`
- `encrypted_dek_b64`, `dek_iv_b64`, `dek_tag_b64`
- `username_ct_b64`, `username_iv_b64`, `username_tag_b64`
- `password_ct_b64`, `password_iv_b64`, `password_tag_b64`

**Внутренние эндпоинты** (Bearer-токен):
- `POST /internal/secret/credentials` — зашифровать и сохранить username/password → `{id: UUID}`
- `POST /internal/secret/decrypt` — расшифровать credentials для заданного `(admin_id, target_id)` после проверки маппинга

**SecretService** используется прокси-слоем для получения plaintext credentials перед upstream-запросом.

Все модели (`TargetSystem`, `Mapping`, `EncryptedBlob`, `AuditEvent`) хранятся в `aml_db` (Beanie ODM). DI-контейнер настраивается в `ioc.py` (Dishka).

## Критерии приёмки

- `POST /internal/secret/credentials` сохраняет зашифрованный blob, возвращает `{id: UUID}`
- `POST /internal/secret/decrypt` возвращает plaintext username/password только при наличии активного маппинга
- Plaintext ни разу не сохраняется в MongoDB
- При отсутствии или неверном KEK все операции шифрования/расшифровки завершаются ошибкой 500 (`CryptoConfigError`)
- Все 4 модели зарегистрированы в Beanie при старте (`aml_db`)
- Dishka DI-контейнер обеспечивает: MongoDB client, Redis client, AuthAdapter, AuditService, SecretService, Settings

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B8.3.01](../tasks/task-b8.3.01.md) | Реализовать envelope encryption/decryption (AES-256-GCM, KEK из env) |
| [TASK-B8.3.02](../tasks/task-b8.3.02.md) | Реализовать эндпоинты создания и расшифровки учётных данных (`/internal/secret/*`) |
| [TASK-B8.3.03](../tasks/task-b8.3.03.md) | Настроить модели Beanie: TargetSystem, Mapping, EncryptedBlob, AuditEvent |
| [TASK-B8.3.04](../tasks/task-b8.3.04.md) | Настроить Dishka DI-контейнер для AML Service (ioc.py) |
