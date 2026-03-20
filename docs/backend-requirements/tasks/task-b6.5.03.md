# TASK-B6.5.03

**Название:** Настроить Promtail (Docker SD, relabeling, pipeline stages для log-level)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.5: Мониторинг и сбор логов](../user-stories/b-us-6.5.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Развернуть Promtail в `docker-compose.yml` для автоматического обнаружения Docker-контейнеров и доставки их логов в Loki.

## Детали реализации

- Образ: `grafana/promtail:3.0.0`, контейнер `promtail-ch`
- Монтирование:
  - `./infra/promtail/promtail-config.yml:/etc/promtail/config.yml:ro`
  - `/var/run/docker.sock:/var/run/docker.sock:ro` (доступ к Docker daemon)
- `depends_on`: loki
- `promtail-config.yml`:
  - HTTP listener: порт 9080
  - Client: `http://loki-ch:3100/loki/api/v1/push`
  - `docker_sd_configs`: host `unix:///var/run/docker.sock`, фильтр по сети `casehub_backend`, refresh 5s
  - Relabeling: `job` из имени контейнера, `service` из лейбла `com.docker.compose.service`, `container` из имени
  - Pipeline stages: `docker {}` (парсинг JSON-формата Docker), regex для извлечения уровня логирования (`DEBUG|INFO|WARN|ERROR|CRITICAL|FATAL`), нормализация `WARNING→WARN`, `CRITICAL/FATAL→ERROR`
- Сеть: `casehub_backend`

## Критерии приёмки

1. Promtail стартует и подключается к Docker socket без ошибок
2. Все контейнеры сети `casehub_backend` обнаруживаются автоматически
3. Лейблы `job`, `service`, `container` проставляются корректно
4. Уровни логирования (`level`) нормализованы и доступны как лейбл в Loki
