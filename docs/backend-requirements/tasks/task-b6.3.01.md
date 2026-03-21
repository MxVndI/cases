# TASK-B6.3.01

**Название:** Настроить MongoDB (Beanie) для auth service  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.3: Базы данных (MongoDB, Redis)](../user-stories/b-us-6.3.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Подключить MongoDB через Motor + Beanie ODM для auth service.

## Детали реализации

- AsyncIOMotorClient(mongodb_url)
- Beanie init_beanie(database, document_models=[Session])
- Database: auth_db

## Критерии приёмки

1. Beanie инициализирован
2. Session сохраняется в MongoDB
