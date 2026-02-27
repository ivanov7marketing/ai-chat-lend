# Фаза 6: Полировка MVP + Bot-сообщения в БД + Яндекс Метрика + E2E-тест

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
- `adminApi.ts` — удалены все MOCK-блоки (кроме Knowledge Base), подключены реальные эндпоинты
- 3 новые страницы: TenantBranding, TenantTeam, TenantBilling

**Фаза 4 (Deploy + E2E):**
- Backend порт 3000→3001 (соответствует docker-compose)
- nginx обновлён (multi-tenant, WebSocket `/ws/:slug`, health proxy)
- CI/CD пересобирает оба контейнера
- seed.ts запущен: суперадмин `m7-agency@yandex.ru` + тенант `default`
- Все 18 API-эндпоинтов проверены через curl ✅

**Фаза 5 (Multi-tenant chat):**
- `chatStore.ts` — WebSocket URL авто-определение из `window.location` (wss/ws), сегменты из tenant config, `setTenantConfig()`, welcome-сообщение из тенанта
- `ChatWindow.tsx` — имя/аватар бота из `useTenant()`, quick-кнопки из `tenantConfig`
- `TenantLanding.tsx` — передача tenant config (bot, segments) в chatStore при mount
- `leads.ts` — резолв `tenant_id` из `sessions` по `session_id`, INSERT с `tenant_id`
- `telegramService.ts` — per-tenant Telegram credentials из `tenant_integrations`, fallback на global env

### Текущее состояние

- VPS: 89.23.102.93, Ubuntu 24.04
- Docker Compose: postgres, backend (3001), frontend, nginx
- Домен: https://ai-chat-lend.ru (SSL Let's Encrypt)
- Суперадмин: `m7-agency@yandex.ru` / `ivanov7755079`
- Тенант default: `m7-agency@yandex.ru` / `i7755079` (slug: `default`)
- Коммит Phase 5: `11351ce`
- WebSocket tenant-aware: `/ws/:slug` → создаёт сессию с `tenant_id`

### ВАЖНО: Оставшиеся проблемы

1. **Bot-сообщения не сохраняются в БД** — `chatStore.ts._addBotMessage()` добавляет сообщение только в React state. Backend WS получает только `user` сообщения (через `saveMessage`), ответы бота не записываются. Это значит `admin/dialogs` показывает только сообщения пользователя.
2. **Яндекс Метрика не подключена** — события `chat_opened`, `estimate_started`, `estimate_completed`, `lead_created` не отправляются. `tenant_integrations.yandex_metrika_counter_id` хранится, но не используется.
3. **`tenant_usage` не обновляется** — таблица `tenant_usage` (sessions_count, messages_count, leads_count) не инкрементируется при создании сессий/сообщений/лидов. Dashboard и Billing показывают нули.
4. **Сессии на лендинге не закрываются** — при закрытии чата (`closeChat()`) WebSocket закрывается, но `sessions.status` остаётся `active` (не ставится `closed`).
5. **admin/dialogs — нет пагинации в backend** — `getDialogs` в `admin.ts` возвращает все сессии без LIMIT/OFFSET, хотя frontend отправляет `limit` и `offset`.

---

## Задачи Фазы 6

### 1. Bot-сообщения в БД
- [ ] В `chatStore.ts._addBotMessage()`: после добавления сообщения в state, отправить через WebSocket `{ type: "message", role: "bot", content: text }`
- [ ] В `ws.ts`: обработать `role === 'bot'` — сохранять через `saveMessage(sessionId, 'bot', data.content)`
- [ ] Альтернативно: сохранять bot-сообщения на стороне backend (если бот генерируется сервером), но пока бот генерируется фронтом — отправлять через WS

### 2. Закрытие сессии при выходе из чата
- [ ] В `chatStore.ts.closeChat()`: перед `socket.close()` отправить `{ type: "session_close" }`
- [ ] В `ws.ts`: обработать `type === 'session_close'` — обновить `sessions.status = 'closed'`
- [ ] В `ws.ts.socket.on('close')`: fallback — если сессия ещё `active`, поставить `closed`

### 3. Инкремент tenant_usage
- [ ] В `sessionService.ts`: после `createSession()` → `UPDATE tenant_usage SET sessions_count = sessions_count + 1 WHERE tenant_id = $1 AND month = date_trunc('month', NOW())`
- [ ] В `sessionService.ts.saveMessage()`: `UPDATE tenant_usage SET messages_count = messages_count + 1 ...`
- [ ] В `leads.ts`: после INSERT лида → `UPDATE tenant_usage SET leads_count = leads_count + 1 ...`
- [ ] Гарантировать UPSERT: если строки в `tenant_usage` для текущего месяца нет — INSERT

### 4. Пагинация dialogs в backend
- [ ] В `admin.ts` эндпоинт `GET /api/t/:slug/admin/dialogs`:
  - Принять `limit` и `offset` из query params
  - Добавить `LIMIT $N OFFSET $M` в SQL-запрос
  - Вернуть `{ data: [...], total: count }` (total через отдельный COUNT query)

### 5. Яндекс Метрика (frontend)
- [ ] Создать `frontend/src/services/metrika.ts`:
  - Функция `initMetrika(counterId: string)` — вставить скрипт Яндекс Метрики в `<head>`
  - Функция `reachGoal(goalName: string)` — обёртка над `ym(counterId, 'reachGoal', goalName)`
- [ ] В `TenantLanding.tsx`: при загрузке тенанта, если `tenant.integrations?.yandexMetrika?.counterId` — вызвать `initMetrika()`
- [ ] Добавить `yandexMetrika` в `TenantConfig` тип (и в backend-ответ `/api/t/:slug/config`)
- [ ] В `chatStore.ts`: в нужных местах вызвать `reachGoal()`:
  - `openChat()` → `reachGoal('chat_opened')`
  - Переход в `FUNNEL` → `reachGoal('estimate_started')`
  - Переход в `SEGMENT_CHOICE` → `reachGoal('estimate_completed')`
  - `submitLead()` → `reachGoal('lead_created')`

### 6. Деплой и проверка
- [ ] `npm run build` frontend и `tsc --noEmit` backend — без ошибок
- [ ] Git commit + push
- [ ] Проверить:
  - Полный цикл воронки на https://ai-chat-lend.ru/default
  - В admin/dialogs видны сообщения бота и пользователя
  - Dashboard показывает ненулевые метрики
  - Сессия меняет статус на `closed` при закрытии чата

---

## Технические детали

- Backend: Fastify, TypeScript, pg (без ORM), порт 3001
- Frontend: React, Tailwind CSS, Vite
- Все команды выполнять с `Cwd = c:\dev\ai-chat-lend` (см. `.agents/workflows/run-commands.md`)
- Дизайн-система: `DESIGN.md` — никаких хардкод hex-цветов, только Tailwind-токены

### Ключевые файлы для этой фазы

| Файл | Что менять |
|------|-----------|
| `frontend/src/store/chatStore.ts` | Отправка bot-сообщений через WS, session_close, Метрика |
| `backend/src/routes/ws.ts` | Обработка bot-сообщений, session_close |
| `backend/src/services/sessionService.ts` | Increment tenant_usage |
| `backend/src/routes/leads.ts` | Increment leads_count в tenant_usage |
| `backend/src/routes/admin.ts` | Пагинация dialogs |
| `frontend/src/services/metrika.ts` | [NEW] Яндекс Метрика helper |
| `frontend/src/pages/tenant/TenantLanding.tsx` | Инициализация Метрики |
| `frontend/src/types/auth.ts` | Расширить TenantConfig (yandexMetrika) |
| `backend/src/routes/tenantPublic.ts` | Добавить yandexMetrika в ответ /config |

### Структура tenant_usage (уже существует)

```sql
tenant_usage (
  tenant_id UUID REFERENCES tenants(id),
  month TIMESTAMP,
  sessions_count INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  leads_count INT DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  pdf_generated INT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  PRIMARY KEY (tenant_id, month)
)
```

### Яндекс Метрика — формат скрипта

```html
<script type="text/javascript">
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  ym(COUNTER_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
</script>
```

Вызов цели: `ym(COUNTER_ID, 'reachGoal', 'lead_created')`
