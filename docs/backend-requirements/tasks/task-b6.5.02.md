# TASK-B6.5.02

**Название:** Настроить Loki (loki-config.yml, TSDB schema v13, retention 7 дней)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.5: Мониторинг и сбор логов](../user-stories/b-us-6.5.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Развернуть Loki в `docker-compose.yml` и настроить конфигурацию для агрегации логов с хранением 7 дней.

## Детали реализации

- Образ: `grafana/loki:3.0.0`, контейнер `loki-ch`, порт `3100:3100`
- Конфиг: `./infra/loki/loki-config.yml:/etc/loki/local-config.yaml:ro`
- Volume: `loki_data:/loki`
- `loki-config.yml`:
  - `auth_enabled: false`
  - HTTP listener: порт 3100
  - Хранилище: filesystem, chunks и rules в `/loki/`
  - Schema: TSDB v13, с `2024-01-01`, index period 24h
  - `retention_period: 168h` (7 дней), compaction interval 10m, `retention_enabled: true`
  - `replication_factor: 1`, kvstore: `inmemory`
  - `max_query_length: 721h`, `max_query_parallelism: 2`
- Сеть: `casehub_backend`

## Критерии приёмки

1. Loki стартует без ошибок, слушает порт 3100
2. Promtail успешно доставляет логи (статус `200` в push-эндпоинте)
3. Логи доступны через Grafana datasource Loki
4. Через 7 дней старые логи удаляются автоматически
