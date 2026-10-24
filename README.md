# FORM3D

Лёгкий интернет-магазин изделий 3D-печати: каталог, варианты, корзина, авторизация, checkout с резервом склада, кабинет клиента, админка и очередь печати.

## Архитектура

- Next.js App Router и Server Components для публичных страниц.
- Route Handlers + Zod — единый серверный validation layer.
- PostgreSQL + Prisma. Деньги хранятся целым числом в копейках.
- Cookie-сессии: в БД хранится только SHA-256 хеш токена; пароли — HMAC-SHA-256 с отдельным серверным pepper, затем bcrypt cost 12 с индивидуальной солью.
- Checkout работает в `Serializable` transaction. Обновление варианта сверяет текущий резерв и доступный остаток, исключая двойную продажу последней единицы.
- `InventoryMovement` хранит журнал резерва/списания/возврата; `AuditLog` — административные изменения.
- Изображения не хранятся в БД: поле содержит URL, поэтому production можно подключить к S3/R2/MinIO.

## Требования

Docker 24+ с Compose либо Node.js 20+ и PostgreSQL 16.

## Быстрый запуск Docker

```bash
cp .env.example .env
# обязательно замените DATABASE_URL, AUTH_SECRET и пароли
docker compose up -d postgres
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run seed
docker compose up -d web
```

Откройте `http://localhost:3000`. Проверка состояния: `/api/health`.

## Локальная разработка

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed
npm run dev
```

## Переменные окружения

- `DATABASE_URL` — строка подключения PostgreSQL.
- `AUTH_SECRET` — случайная строка не короче 32 символов (зарезервирована для будущих OAuth-провайдеров).
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — dev-администратор; без них seed администратора не создаёт.
- `NEXT_PUBLIC_STORE_URL` — публичный HTTPS URL для sitemap/canonical.
- `APP_URL` — публичный URL сайта для ссылки подтверждения регистрации.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` — ключи виджета Cloudflare Turnstile. Создайте виджет в Cloudflare Dashboard → Turnstile и добавьте hostname сайта; секрет задаётся только серверу.
- `TURNSTILE_HOSTNAMES` — необязательный список разрешённых hostname через запятую, например `shop.example.ru,localhost`.
- `STORE_PHONE`, `STORE_EMAIL`, `STORE_TELEGRAM` — контакты магазина.

## Команды

```bash
npm run typecheck
npm test
npm run build
npx prisma studio        # временный интерфейс редактирования товаров
npx prisma migrate dev   # новая миграция
npx prisma migrate deploy
```

Админка находится по адресу `/admin`. Роль проверяется на сервере и повторно в каждом mutating API.

## Производственный сценарий

Новый заказ атомарно резервирует остаток и создаёт `ProductionTask` на каждую позицию. В `/admin/production` мастер начинает и завершает печать. Отмена заказа возвращает резерв, завершение заказа уменьшает `stock` и `reserved`, каждое действие попадает в журнал.

## Backup PostgreSQL

```bash
docker compose exec -T postgres pg_dump -U printlab -Fc printlab > printlab.dump
docker compose exec -T postgres pg_restore -U printlab -d printlab --clean < printlab.dump
```

Храните резервные копии вне сервера и регулярно проверяйте восстановление.

## Deployment и безопасность

Размещайте приложение за Cloudflare и reverse proxy: включите Full (strict) TLS, managed WAF, bot protection, лимиты на `/api/auth/*`, `/api/checkout` и `/api/contact`, кэш только для статических файлов `/_next/static/*`. Не кэшируйте HTML, API, account и admin. Добавьте HSTS на HTTPS-прокси. Не коммитьте `.env` и пользовательские загрузки.

Перед production замените in-memory rate limiter на Redis/Cloudflare rate limiting при запуске нескольких web-инстансов. Для пользовательских загрузок настройте проверку MIME/размера, антивирус и presigned upload в S3/R2.

## Что дальше

Схема уже содержит отзывы, галерею, настройки, аудит и варианты. Следующие практичные шаги: форма CRUD товаров с presigned upload, восстановление пароля через почту, интеграционные Playwright-тесты и провайдер доставки/оплаты.
