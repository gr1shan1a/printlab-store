# Домен магазина

Основной адрес: https://v2gr1.ru (также доступен www.v2gr1.ru).
A-записи @ и www: 185.192.246.155.

Системный Nginx: /etc/nginx/sites-available/v2gr1.ru,
включён через /etc/nginx/sites-enabled/v2gr1.ru.
Проксирует запросы на 127.0.0.1:32741.
Копия конфигурации: v2gr1.ru.nginx.conf.

Сертификат Let's Encrypt: /etc/letsencrypt/live/v2gr1.ru/.
Продление выполняется certbot.timer с плагином nginx.

NEXT_PUBLIC_STORE_URL в .env: https://v2gr1.ru.
Адрес передаётся в сборку Docker и в окружение приложения.
После смены адреса:

```sh
docker compose build web
docker compose up -d --no-deps web
```

После изменения nginx.conf внутреннего прокси:

```sh
docker compose exec -T proxy nginx -t
docker compose exec -T proxy nginx -s reload
```

## Пересборка с защитой ресурсов VPN

Вместо обычного `docker compose build web` используйте из каталога проекта:

```sh
sudo python3 scripts/rebuild-safe.py
```

Скрипт требует минимум 10 ГБ свободного диска, очищает ненужный кэш,
сериализует сборки, ограничивает сборочный контейнер до 1536 МиБ RAM
и 2 ГиБ RAM вместе со swap, затем обновляет только web. Использует legacy
builder Docker, потому что его лимиты памяти поддерживаются на этом сервере.
При недостатке памяти сборка может завершиться ошибкой; работающий web сохраняется.
Обычная команда `docker compose build` обходит эту защиту. Все сборки других
проектов также нужно ограничивать отдельно.

На сервере установлен `docker-housekeeping.timer` (каждые 15 минут).
Исходники лежат в `deploy/maintenance/`. Он удаляет неиспользуемый кэш и
старые dangling-образы, не удаляет тома и контейнеры, повышает приоритет
VPN-процессов при OOM и задаёт мягкую защиту 128 МиБ через cgroup memory.low.
При свободном диске меньше 8 ГиБ очистка кэша усиливается.
Это не жёсткая дисковая квота: растущие данные или сторонние сборки могут
исчерпать диск. Настройки ротации Docker-логов на сервере: 50 МиБ × 3 файла.
В compose VPN сохранены oom_score_adj=-900 и mem_reservation=128m.
