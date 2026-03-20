# TASK-B8.3.01

**Название:** Реализовать envelope encryption/decryption (AES-256-GCM, KEK из env)  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.3: Безопасное хранение учётных данных](../user-stories/b-us-8.3.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `services/crypto.py` — двухуровневое шифрование учётных данных.

## Детали реализации

- `envelope_encrypt(settings, username, password)`:
  1. Декодировать KEK из `settings.aml_kek_b64` (Base64 → 32 байта) → ошибка `CryptoConfigError` если пусто/некорректно
  2. Генерировать случайный DEK (32 байта)
  3. Зашифровать DEK через AES-256-GCM (KEK) → `encrypted_dek`, `dek_iv`, `dek_tag`
  4. Зашифровать username через AES-256-GCM (DEK) → `username_ct`, `username_iv`, `username_tag`
  5. Зашифровать password через AES-256-GCM (DEK) → `password_ct`, `password_iv`, `password_tag`
  6. Вернуть все поля как бинарные данные
- `to_b64_fields(fields)` — конвертация бинарных полей в Base64-строки для хранения в MongoDB
- `from_b64_fields(fields)` — обратная конвертация из Base64
- `envelope_decrypt(settings, ...)`:
  1. Декодировать KEK
  2. Расшифровать DEK (AES-256-GCM)
  3. Расшифровать username и password (AES-256-GCM с DEK)
  4. Вернуть `(username, password)`
- `CryptoConfigError` — исключение при некорректном KEK

## Критерии приёмки

1. `envelope_encrypt` → `envelope_decrypt` возвращает исходные username/password
2. При пустом/некорректном KEK → `CryptoConfigError`
3. Каждый вызов `envelope_encrypt` генерирует уникальные IV и DEK
4. Plaintext не присутствует в возвращаемых данных
