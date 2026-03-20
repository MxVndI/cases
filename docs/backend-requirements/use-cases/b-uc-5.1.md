# B-UC-5.1: Аутентификация администратора (Admin BFF)

**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)

## Описание

Аутентификация администратора в Admin Service (BFF). Статических паролей нет — используется cookie-based auth через общую систему аутентификации. Admin Service проксирует запросы к Cases Service, User Service и Auth Service.

## Акторы

- **Первичный:** Администратор
- **Система:** Admin Service, Auth Service, User Service

## Предусловия

- Администратор авторизован через OAuth / email (cookie `sid` установлен)
- Пользователь имеет роль `admin` в User Service

## Механизм аутентификации — `require_admin` dependency

1. Admin Service извлекает `sid` из cookie (`AdminCookies` Pydantic model)
2. Если `sid` отсутствует → 401 (Authentication required)
3. Admin Service вызывает `AdminAuth.get_admin_user_id(sid)`:
   - **Шаг 1:** HTTP `GET {auth_service_url}/verify_user/{sid}?token=...` → получает `{uid: "..."}`
   - Если Auth Service возвращает ошибку → 401 (Invalid session)
   - **Шаг 2:** HTTP `GET {user_service_url}/v1/users/{uid}` с `Authorization: Bearer <token>` → получает данные пользователя
   - Если `role != "admin"` → 403 (Admin access required)
4. При успехе — возвращается `uid` администратора

## Проксирование запросов

Admin Service (BFF) проксирует запросы к другим сервисам, добавляя межсервисный токен:
- Cases Service: CRUD кейсов, предметов, тегов, редкостей, оружия, типов оружия
- User Service: управление пользователями
- Storage: загрузка изображений

## Постусловия

- Администратор аутентифицирован, запросы проксируются с межсервисным токеном

## Альтернативные сценарии

1. **Cookie `sid` отсутствует** → 401
2. **Сессия невалидна** (Auth Service возвращает ошибку) → 401
3. **Пользователь не admin** (`role != admin`) → 403
4. **Auth Service недоступен** → 503
5. **User Service недоступен** → 503

## Связанные User Stories

- [B-US-5.1](../user-stories/b-us-5.1.md)
- [B-US-5.2](../user-stories/b-us-5.2.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-5.1](sequences.md)
