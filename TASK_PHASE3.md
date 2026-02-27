# Задача: Multi-Tenant SaaS — Фаза 3 (Интеграция frontend ↔ backend + полировка)

## Контекст проекта

Проект ai-chat-lend — чат-лендинг для расчёта сметы ремонта квартиры, трансформируется в multi-tenant SaaS-платформу.

## Что уже сделано

### Документация (ОБЯЗАТЕЛЬНО ПРОЧИТАТЬ)
- `GEMINI.md` — правила генерации кода, стек, структура
- `DESIGN.md` — дизайн-система (цвета, типографика, компоненты, Tailwind-токены)
- `AGENTS.md` — правила для AI-агента (запреты, git workflow)
- `REFACT.md` — полная спецификация multi-tenant трансформации (15 разделов)

### Фаза 1 — Backend (готово)
1. **БД миграция** (`backend/src/db/migrate.ts`): 11 новых таблиц (`tenants`, `tenant_bot_settings`, `tenant_branding`, `tenant_segments`, `tenant_bot_behavior`, `tenant_integrations`, `tenant_users`, `platform_admins`, `tenant_usage`, `platform_audit_log`), `tenant_id` в `sessions`, `leads`, `work_types`, `estimates`
2. **Middleware**: `tenantResolver.ts` (определяет tenant по slug), `authGuard.ts` (JWT access 15 мин + refresh 7 дней)
3. **Auth сервис** (`authService.ts`): `registerTenant()`, `loginTenant()`, `loginSuperAdmin()`, `refreshTokens()`, `checkSlugAvailability()`
4. **Роуты**: `auth.ts` (register/login/refresh/check-slug), `tenantPublic.ts` (GET `/api/t/:slug/config`), `superAdmin.ts` (dashboard/tenants/block/unblock/audit), `admin.ts` (старые `/api/admin/*` + новые `/api/t/:slug/admin/*`)
5. **Изменённые сервисы**: `adminService.ts` и `sessionService.ts` принимают `tenantId`

### Фаза 2 — Frontend маршрутизация и авторизация (готово, всё компилируется)
1. **Типы**: `types/auth.ts` — AuthUser, AuthResponse, TenantConfig, PlatformMetrics, TenantListItem, TenantDetailData, AuditLogEntry и т.д.
2. **API-сервисы**:
   - `services/authApi.ts` — registerTenant, loginTenant, loginSuperAdmin, refreshTokens, checkSlug, getTenantConfig
   - `services/superAdminApi.ts` — getDashboard, getTenants, getTenantDetail, updateTenant, blockTenant, unblockTenant, getAuditLog
   - `services/adminApi.ts` — модифицирован: все URL через `getAdminBase()` → `/api/t/:slug/admin/...` + auth header
3. **Контексты**:
   - `contexts/AuthContext.tsx` — JWT management, localStorage, auto-refresh каждые 14 мин, login/logout/register
   - `contexts/TenantContext.tsx` — загружает конфиг тенанта по slug, loading/404 экраны
4. **Guards**: `AuthGuard.tsx` (redirect на /login), `SuperAdminGuard.tsx` (проверка type=superadmin)
5. **Страницы платформы**:
   - `pages/platform/PlatformLanding.tsx` — маркетинговый лендинг (hero, features, pricing, FAQ)
   - `pages/platform/LoginPage.tsx` — вход с переключателем Тенант/Суперадмин
   - `pages/platform/RegisterPage.tsx` — регистрация с live slug-check + транслитерация
6. **Суперадмин**:
   - `pages/superadmin/SuperAdminLayout.tsx` — sidebar (дашборд, тенанты, аудит)
   - `pages/superadmin/SuperDashboard.tsx` — 5 метрик + MRR
   - `pages/superadmin/TenantsList.tsx` — таблица с поиском/фильтрами/пагинацией
   - `pages/superadmin/TenantDetail.tsx` — информация, usage, действия (блокировка, смена тарифа)
   - `pages/superadmin/AuditLogPage.tsx` — таблица лога
7. **Тенант**:
   - `pages/tenant/TenantAdminLayout.tsx` — обёртка с TenantProvider + slug-based NavLinks
   - `pages/tenant/TenantLanding.tsx` — динамический лендинг с брендингом тенанта
8. **Маршрутизация** (`App.tsx`): `/` → PlatformLanding, `/login`, `/register`, `/admin` → SuperAdmin [guard], `/:slug` → TenantLanding, `/:slug/admin` → TenantAdmin [guard]
9. **chatStore.ts** — `tenantSlug` + `setTenantSlug`, WS URL `/ws/:slug`
10. **HeroBlock.tsx** — опциональные `title`/`subtitle` пропсы

## Что нужно сделать (Фаза 3)

### 3.1. Интеграция backend-frontend: реальные API вместо mock-данных

Сейчас многие функции в `adminApi.ts` используют mock-данные (MOCK_PERSONALITY, MOCK_SEGMENTS, MOCK_BEHAVIOR, MOCK_DOCUMENTS, MOCK_INTEGRATIONS). Нужно:

1. **Backend**: создать недостающие эндпоинты тенант-админки (`/api/t/:slug/admin/...`):
   - `GET /api/t/:slug/admin/bot/personality` → из `tenant_bot_settings`
   - `PUT /api/t/:slug/admin/bot/personality`
   - `GET /api/t/:slug/admin/bot/segments` → из `tenant_segments`
   - `PUT /api/t/:slug/admin/bot/segments/:id`
   - `GET /api/t/:slug/admin/bot/behavior` → из `tenant_bot_behavior`
   - `PUT /api/t/:slug/admin/bot/behavior`
   - `GET /api/t/:slug/admin/integrations` → из `tenant_integrations`
   - `PUT /api/t/:slug/admin/integrations/:service`
   - `POST /api/t/:slug/admin/integrations/:service/test`
   - `GET /api/t/:slug/admin/dashboard/metrics` — реальные метрики по tenant_id
   - `PUT /api/t/:slug/admin/dialogs/:id/rating`
   - `POST /api/t/:slug/admin/prices` — добавление вида работ

2. **Frontend** (`adminApi.ts`): убрать все MOCK_* данные, подключить к реальным эндпоинтам через `getAdminBase()`

3. **Backend**: создать полноценный endpoint `GET /api/superadmin/dashboard` с агрегированными метриками (сейчас на фронте fallback `{ totalTenants: 0, ... }`)

### 3.2. WebSocket с tenant-контекстом

Сейчас `ws/chatHandler.ts` поддерживает `/ws/:slug`, но нужно убедиться:
- При подключении к `/ws/:slug` извлекается `tenant_id` из slug
- `createSession()` вызывается с `tenantId`
- Всё сообщения привязываются к сессии с правильным `tenant_id`
- Проверяется `is_active` тенанта при подключении

### 3.3. Миграция текущих данных

Создать скрипт/команду для инициализации дефолтного тенанта:
- Создать тенант с slug `default` (или по env переменной `DEFAULT_TENANT_SLUG`)
- Привязать все существующие `sessions`, `leads`, `work_types`, `estimates` к этому тенанту
- Создать seed-данные: `tenant_bot_settings`, `tenant_branding`, `tenant_segments`, `tenant_bot_behavior`, `tenant_integrations`
- Создать суперадмина (email/пароль из env)

### 3.4. Tenant admin — отсутствующие боковые страницы (по REFACT.md §7)

Существующие админ-страницы (Dashboard, Dialogs, Bot, Prices, Integrations) уже переиспользуются. Но нужны новые:
- `/:slug/admin/branding` — настройка внешнего вида лендинга (цвета, логотип, тексты)
- `/:slug/admin/team` — управление сотрудниками тенанта
- `/:slug/admin/billing` — тариф, использование ресурсов, прогресс-бары

### 3.5. End-to-end тестирование

Проверить полный flow:
1. Регистрация нового тенанта → redirect в админку
2. Логин тенанта → redirect по slug
3. Посадочная страница тенанта → загрузка конфига → чат
4. Админка тенанта → реальные данные из БД
5. Суперадмин → дашборд с метриками → список тенантов → детали
6. WebSocket чата через `/ws/:slug`

### 3.6. Docker и деплой

- Добавить `JWT_SECRET`, `JWT_REFRESH_SECRET` в `.env` (на сервере)
- Проверить `docker-compose.yml` — все новые env-переменные переданы в backend
- Создать начальную миграцию (`npm run migrate` или при старте бэкенда)
- Проверить что nginx проксирует `/ws/:slug` и все новые API пути

## Порядок работы

1. Прочитать `REFACT.md`, `DESIGN.md`, `AGENTS.md`
2. Миграция данных: скрипт инициализации дефолтного тенанта + суперадмина
3. Backend: недостающие эндпоинты тенант-админки
4. Frontend: замена mock-данных на реальные API
5. WebSocket: проверка tenant-контекста
6. Новые страницы: branding, team, billing
7. Docker/env: добавить JWT секреты
8. Проверить build (frontend + backend), commit, push

## Важные ограничения

- **Frontend**: React + Tailwind CSS + Framer Motion (уже установлены)
- **Backend**: JavaScript (НЕ TypeScript), Fastify (НЕ Express), `pg` без ORM
- **НЕ использовать** hardcoded hex-цвета — только Tailwind-токены из DESIGN.md
- **Все команды** запускать через `Set-Location frontend; ...` или `Set-Location backend; ...` с `Cwd = c:\dev\ai-chat-lend` (баг с subdirectory Cwd)
- **Git**: `git commit -m "..."` + `git push origin main`
- **Проверка перед коммитом**: `npm run build` в frontend И `npx tsc --noEmit` в backend
