совместимость на всех экранах
на мобилке сделать как приложение
хеш выигрыша
сообщения в нижнем правом углу - расширить
проверить безопасность
скрипт для автоматического разворачивания данных
мелкие правки по UI
допилить админку

---

## Логирование через Loki

### Архитектура

```
[auth]    stdout/stderr ──┐
[cases]   stdout/stderr ──┤
[user]    stdout/stderr ──┤──► Promtail ──► Loki ──► Grafana (datasource)
[admin]   stdout/stderr ──┤              (хранит)   (уже поднята)
[aml]     stdout/stderr ──┤
[payment] stdout/stderr ──┘
```

- **Promtail** — агент: обнаруживает контейнеры через Docker socket (`docker_sd_configs`),
  читает их JSON-логи из `/var/lib/docker/containers`, добавляет лейблы
  `job`, `container`, `level`, толкает в Loki (push).
  На Docker Desktop for Windows оба пути (`/var/run/docker.sock` и `/var/lib/docker/containers`)
  доступны внутри контейнеров (монтируются из Linux VM), проблем совместимости нет.
- **Loki** — хранилище: хранит логи сжато, индексирует только лейблы (не текст),
  отвечает на LogQL-запросы от Grafana
- **Grafana** — уже поднята, добавить Loki как второй datasource рядом с Prometheus

### Что нужно сделать

#### 1. Инфраструктура
- [ ] Создать `infra/loki/loki-config.yml` — конфиг хранилища (filesystem storage, retention 7d)
- [ ] Создать `infra/promtail/promtail-config.yml` — конфиг агента:
  - `docker_sd_configs` — автообнаружение контейнеров через Docker socket
  - relabel: вытащить `container_name` из `__meta_docker_container_name`,
    назначить `__path__` на `/var/lib/docker/containers/<id>/<id>-json.log`
  - pipeline: парсить Docker JSON log (`json`, `timestamp`),
    извлечь `level` regex-ом из текста (INFO/ERROR/WARNING/DEBUG)
- [ ] Добавить в `docker-compose.yml` два сервиса:
  - `loki` (image: `grafana/loki:3.0.0`, container: `loki-ch`, порт 3100, volume `loki_data`)
  - `promtail` (image: `grafana/promtail:3.0.0`, container: `promtail-ch`,
    mount `/var/lib/docker/containers:ro` и `/var/run/docker.sock:ro`)
- [ ] Добавить volume `loki_data` в секцию volumes
- [ ] Добавить `depends_on: loki` для `grafana`

#### 2. Grafana — provisioning
- [ ] Создать `infra/grafana/provisioning/datasources/loki.yml` — автопровижининг datasource
  (url: `http://loki-ch:3100`, type: loki) — используем container_name для единообразия с prometheus-ch
- [ ] Добавить панель логов в `casehub-overview.json`:
  - "Последние ошибки" — Logs panel, запрос `{job=~".+"} |= "ERROR"`
  - Привязать к временному диапазону дашборда

#### 3. Сервисы — улучшение формата логов (опционально, но полезно)
- [ ] **auth, user, cases, aml** (`stdlib logging`) — добавить JSON-форматтер чтобы Promtail
  мог парсить `level` и `message` как структурированные поля
- [ ] **admin** (Loguru) — единственный сервис с Loguru; уже умеет JSON:
  `logger.add(sys.stdout, serialize=True)` в `setup_logging()`
- [ ] **payment** (Rust) — нет logging-крейта (только `println!`); добавить
  `tracing` + `tracing-subscriber` с JSON-форматом

### Оценка сложности

| Шаг | Сложность | Время |
|-----|-----------|-------|
| Loki + Promtail в docker-compose | ★☆☆☆☆ | 30 мин |
| Promtail конфиг (Docker scrape) | ★★☆☆☆ | 1 ч |
| Grafana datasource provisioning | ★☆☆☆☆ | 15 мин |
| Панель логов на дашборде | ★☆☆☆☆ | 15 мин |
| JSON-логи в Python-сервисах | ★★☆☆☆ | 1 ч |
| JSON-логи в Rust (payment) | ★★★☆☆ | 1 ч |
| **Итого (минимум — без JSON)** | | **~2 ч** |
| **Итого (полный)** | | **~4 ч** |