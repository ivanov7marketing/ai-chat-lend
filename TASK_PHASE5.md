# Фаза 5: Multi-tenant чат + Tenant-Aware Leads + Telegram per Tenant

## Контекст проекта

Проект **ai-chat-lend** — multi-tenant SaaS платформа (чат-лендинг для расчёта сметы ремонта).
Основные документы: `GEMINI.md`, `DESIGN.md`, `AGENTS.md`, `REFACT.md`.

### Завершённые фазы

**Фаза 1 (Backend multi-tenant):**
- 12+ таблиц в PostgreSQL (tenants, tenant_bot_settings, tenant_branding, tenant_segments, tenant_bot_behavior, tenant_integrations, tenant_users, platform_admins, tenant_usage, platform_audit_log + tenant_id в sessions/leads/work_types/estimates)
- Middleware: `tenantResolver.ts`, `authGuard.ts`
- Auth: `authService.ts` (register, login, refresh, slug check, seedTenantDefaults)
- Маршруты: `auth.ts`, `superAdmin.ts`, `tenantPublic.ts`

**Фаза 2 (Frontend routing & auth):**
- `AuthContext.tsx`, `TenantContext.tsx`
- Guards: `SuperAdminGuard`, `AuthGuard`
- Routing: `/` (платформа), `/login`, `/register`, `/admin` (суперадмин), `/:slug` (лендинг тенанта), `/:slug/admin/*` (админ тенанта)

**Фаза 3 (Integration):**
- `tenantAdminService.ts` — 18 CRUD-функций
- `admin.ts` — ~20 эндпоинтов `/api/t/:slug/admin/*`
- `seed.ts` — скрипт инициализации
- `adminApi.ts` — удалены все MOCK-блоки, подключены реальные эндпоинты
- 3 новые страницы: TenantBranding, TenantTeam, TenantBilling

**Фаза 4 (Deploy + E2E):**
- Backend порт 3000→3001 (соответствует docker-compose)
- nginx обновлён (multi-tenant, WebSocket `/ws/:slug`, health proxy)
- CI/CD пересобирает оба контейнера
- seed.ts запущен: суперадмин `m7-agency@yandex.ru` + тенант `default`
- Все 18 API-эндпоинтов проверены через curl ✅

### Текущее состояние

- VPS: 89.23.102.93, Ubuntu 24.04
- Docker Compose: postgres, backend (3001), frontend, nginx
- Домен: https://ai-chat-lend.ru (SSL Let's Encrypt)
- Суперадмин: `m7-agency@yandex.ru` / `ivanov7755079`
- Тенант default: `m7-agency@yandex.ru` / `i7755079` (slug: `default`)

### ВАЖНО: Текущие проблемы

Чат-виджет (`ChatWindow`) работает, воронка из 9 шагов работает, сбор лида работает. Но:

1. **Чат не использует tenant-specific настройки бота** — `chatStore.ts` хардкодит имя бота «Макс», welcome-сообщение, quick-кнопки из `config/funnel.ts` вместо данных из `/api/t/:slug/config`
2. **WebSocket URL не production-ready** — `chatStore.ts` строка 67: `VITE_WS_URL || 'ws://localhost:3000'` — в production должен быть `wss://ai-chat-lend.ru`
3. **Leads route не tenant-aware** — `leads.ts` вставляет в БД без `tenant_id`
4. **Telegram-уведомления не tenant-aware** — `telegramService.ts` использует глобальные `process.env.TELEGRAM_*` вместо tenant_integrations
5. **Сегменты/ставки хардкодятся в chatStore** — строки 200-229: `rates = { 'Эконом': [5000, 8000], ... }` вместо данных из `tenant_segments`

---

## Задачи Фазы 5

### 1. WebSocket URL в production
- [ ] В `chatStore.ts` строка 67: сделать автоопределение WebSocket URL из `window.location`
  - Production: `wss://ai-chat-lend.ru/ws/:slug`
  - Dev: `ws://localhost:3001/ws/:slug`
  - Формула: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/${slug}`

### 2. Чат использует настройки тенанта
- [ ] В `ChatWindow.tsx`:
  - Получить tenant config из `TenantContext` (через `useTenant()`)
  - Имя бота в header = `tenant.bot.name` (сейчас хардкод «Макс»)
  - Аватар бота = `tenant.bot.avatarUrl`
- [ ] В `chatStore.ts`:
  - `WELCOME_MESSAGE` → брать из `tenant.bot.welcomeMessage` (передавать в openChat → _addBotMessage)
  - `WELCOME_QUICK_BUTTONS` → брать из `tenant.bot.quickButtons`
  - Сегменты и ставки из `tenant.segments` вместо хардкодa
- [ ] Прокинуть tenant config в chatStore (через параметры `openChat()` или через отдельный метод `setTenantConfig()`)

### 3. Leads route tenant-aware
- [ ] В `leads.ts`:
  - Добавить определение `tenant_id` по `session_id` (через JOIN sessions)
  - INSERT в таблицу leads с `tenant_id`
  - Или: принимать `tenantSlug` в body и резолвить `tenant_id`
- [ ] Альтернативный путь: переделать на `/api/t/:slug/leads` с `tenantResolver` middleware

### 4. Telegram-уведомления per tenant
- [ ] Изменить `telegramService.ts`:
  - Принимать `tenantId` как параметр
  - Загружать `telegram_bot_token` и `telegram_chat_id` из `tenant_integrations`
  - Fallback на глобальные `process.env.TELEGRAM_*` если tenant не настроил свои
- [ ] В `leads.ts`: передавать `tenantId` в `sendTelegramNotification(message, tenantId)`

### 5. Сегменты из tenant config вместо хардкода
- [ ] В `chatStore.ts` строки 200-229:
  - Вместо хардкод `rates = { 'Эконом': [5000, 8000], ... }`
  - Использовать данные из `tenant.segments` (прокинуть через `setTenantConfig()`)
  - Формат из API: `{ name: "Эконом", priceRangeMin: 15000, priceRangeMax: 22000 }`
  - Конвертировать priceRangeMin/Max → rates per m²

### 6. Деплой и проверка
- [ ] `npm run build` frontend и `tsc --noEmit` backend — без ошибок
- [ ] Git commit + push
- [ ] Проверить чат на https://ai-chat-lend.ru/default — полный цикл воронки
- [ ] Проверить Telegram-уведомление при submit лида

---

## Технические детали

- Backend: Fastify, TypeScript, pg (без ORM), порт 3001
- Frontend: React, Tailwind CSS, Vite
- Все команды выполнять с `Cwd = c:\dev\ai-chat-lend` (см. `.agents/workflows/run-commands.md`)
- Дизайн-система: `DESIGN.md` — никаких хардкод hex-цветов, только Tailwind-токены

### Ключевые файлы для этой фазы

| Файл | Что менять |
|------|-----------|
| `frontend/src/store/chatStore.ts` | WebSocket URL, tenant config, сегменты |
| `frontend/src/components/chat/ChatWindow.tsx` | Имя/аватар бота из tenant context |
| `frontend/src/pages/tenant/TenantLanding.tsx` | Передача tenant config в chatStore |
| `backend/src/routes/leads.ts` | tenant_id в INSERT |
| `backend/src/services/telegramService.ts` | Per-tenant Telegram credentials |
| `frontend/src/config/funnel.ts` | Welcome message/buttons → tenant-dynamic |

### Данные тенанта из `/api/t/:slug/config` (уже работает)

```json
{
  "slug": "default",
  "companyName": "AI Max Demo",
  "city": "Челябинск",
  "branding": { "primaryColor": "#22c55e", ... },
  "bot": {
    "name": "Макс",
    "avatarUrl": null,
    "tone": "friendly",
    "welcomeMessage": "Привет! Я Макс — ...",
    "quickButtons": [
      { "id": "1", "text": "Рассчитать стоимость ремонта", "emoji": "🧮", "action": "start_funnel" },
      ...
    ]
  },
  "segments": [
    { "name": "Эконом", "description": "...", "priceRangeMin": 15000, "priceRangeMax": 22000 },
    { "name": "Стандарт", "priceRangeMin": 22000, "priceRangeMax": 35000 },
    { "name": "Комфорт", "priceRangeMin": 35000, "priceRangeMax": 55000 },
    { "name": "Премиум", "priceRangeMin": 55000, "priceRangeMax": 100000 }
  ],
  "behavior": { "estimateDisclaimer": "..." }
}
```
