# TASK-B8.1.03

**Название:** Реализовать прокси-эндпоинт (`/aml/proxy/{target_id}/{path}`) с upstream session store  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.1: Проксированный доступ к управляющим UI](../user-stories/b-us-8.1.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `routes/proxy.py` — прозрачный HTTP-прокси к управляющим UI с поддержкой upstream-сессий.

## Детали реализации

- Эндпоинт: `@router.api_route("/{target_id}/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])`
- Аутентификация: sid-cookie → `AuthAdapter.get_admin_id_by_sid`
- Проверка маппинга: `Mapping.find_one(admin_id, target_id, disabled=False)` → 403 если нет
- Получение `TargetSystem` → 404 если нет/disabled
- `UpstreamSessionStore(redis)`: `get_cookies(admin_id, target_id)` → подставить в `Cookie` header
- Фильтрация заголовков: удаление hop-by-hop (`connection`, `keep-alive`, `transfer-encoding` и др.) и `Host`
- aiohttp `ClientSession.request(method, upstream_url, headers, data)` → проксирование тела и query-параметров
- Обработка `Set-Cookie` в ответе upstream: `apply_set_cookie_headers` → `store.set_cookies(admin_id, target_id, cookies, ttl=3600)`
- Возврат `Response(content, status_code, headers)` клиенту
- `AuditService.emit(event_type="proxy_access", admin_id, target_id, metadata={"path": path})`

## Критерии приёмки

1. Запрос без sid → 401
2. Запрос с валидным sid, но без маппинга → 403
3. Запрос к disabled target → 404
4. Запрос успешно проксируется; ответ upstream возвращается клиенту
5. Upstream cookies сохраняются в Redis и переиспользуются в следующих запросах
6. Hop-by-hop заголовки не передаются upstream и не возвращаются клиенту
