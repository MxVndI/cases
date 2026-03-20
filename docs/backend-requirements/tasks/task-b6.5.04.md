# TASK-B6.5.04

**Название:** Настроить Grafana с provisioning datasources (Prometheus + Loki)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.5: Мониторинг и сбор логов](../user-stories/b-us-6.5.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Развернуть Grafana в `docker-compose.yml` с автоматическим подключением datasources через provisioning.

## Детали реализации

- Образ: `grafana/grafana:11.4.0`, контейнер `grafana-ch`, порт `3000:3000`
- Переменные окружения:
  - `GF_SECURITY_ADMIN_USER: admin`
  - `GF_SECURITY_ADMIN_PASSWORD: admin`
- Volumes:
  - `grafana_data:/var/lib/grafana` — персистентное хранилище
  - `./infra/grafana/provisioning:/etc/grafana/provisioning` — provisioning YAML
  - `./infra/grafana/dashboards:/var/lib/grafana/dashboards` — JSON dashboards
- `depends_on`: prometheus, loki
- Provisioning datasources:
  - `datasource.yml`: Prometheus, uid `prometheus`, URL `http://prometheus-ch:9090`, isDefault: true
  - `loki.yml`: Loki, uid `loki`, URL `http://loki-ch:3100`, maxLines 1000
- Provisioning dashboards:
  - `dashboards.yml`: provider `default`, путь `/var/lib/grafana/dashboards`
- Сеть: `casehub_backend`

## Критерии приёмки

1. Grafana доступна на `http://localhost:3000`
2. Datasource Prometheus подключён автоматически (isDefault), статус OK
3. Datasource Loki подключён автоматически, статус OK
4. Оба datasource видны в Grafana без ручной настройки
