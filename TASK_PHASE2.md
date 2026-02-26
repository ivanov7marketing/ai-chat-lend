# Задача: Multi-Tenant SaaS — Фаза 2 (Frontend-маршрутизация и авторизация)

## Контекст проекта

Проект ai-chat-lend — чат-лендинг для расчёта сметы ремонта квартиры. AI-эксперт «Макс» ведёт пользователя через воронку и собирает лид.

Проект трансформируется из single-tenant в **multi-tenant SaaS-платформу**, где каждая компания по ремонту регистрируется и получает свою посадочную страницу с чатом и админку.

## Что уже сделано (Фаза 1 — backend)

### Документация
- `GEMINI.md` — правила генерации кода, стек, структура
- `DESIGN.md` — дизайн-система (цвета, типографика, компоненты, Tailwind-токены)
- `AGENTS.md` — правила для AI-агента (запреты, git workflow)
- `ADMINPANEL.md` — спецификация админ-панели
- `REFACT.md` — полная спецификация multi-tenant трансформации (15 разделов), **ОБЯЗАТЕЛЬНО ПРОЧИТАТЬ ПЕРЕД НАЧАЛОМ РАБОТЫ**

### Backend (готово, всё компилируется)
1. **БД миграция** (`backend/src/db/migrate.ts`):
   - 11 новых таблиц: `tenants`, `tenant_bot_settings`, `tenant_branding`, `tenant_segments`, `tenant_bot_behavior`, `tenant_integrations`, `tenant_users`, `platform_admins`, `tenant_usage`, `platform_audit_log`
   - `tenant_id` добавлен в `sessions`, `leads`, `work_types`, `estimates`

2. **Middleware**:
   - `middleware/tenantResolver.ts` — определяет tenant по `:slug` из URL, кеш 60 сек
   - `middleware/authGuard.ts` — JWT (access 15 мин + refresh 7 дней), guard factory для 3 типов: `tenant_owner`, `tenant_user`, `superadmin`

3. **Auth сервис** (`services/authService.ts`):
   - `registerTenant()` — валидация slug, reserved slugs, email unique, bcrypt, автоматические seed-данные
   - `loginTenant()`, `loginSuperAdmin()`, `refreshTokens()`, `checkSlugAvailability()`

4. **Новые роуты**:
   - `routes/auth.ts` — POST `/api/auth/register`, `/api/auth/login`, `/api/auth/superadmin`, `/api/auth/refresh`, GET `/api/auth/check-slug`
   - `routes/tenantPublic.ts` — GET `/api/t/:slug/config` (публичный конфиг для лендинга)
   - `routes/superAdmin.ts` — GET/PUT `/api/superadmin/dashboard`, `/api/superadmin/tenants`, `/api/superadmin/tenants/:id`, block/unblock, audit

5. **Изменённые файлы**:
   - `services/adminService.ts` — все запросы принимают `tenantId` для data isolation
   - `services/sessionService.ts` — `createSession()` принимает `tenantId`
   - `routes/admin.ts` — старые `/api/admin/*` (обратная совместимость) + новые `/api/t/:slug/admin/*`
   - `routes/ws.ts` — `/ws` (совместимость) + `/ws/:slug` (multi-tenant)
   - `index.ts` — регистрация всех новых плагинов

### Frontend админ-панель (готово, всё компилируется)
- `types/admin.ts` — 20+ TypeScript-интерфейсов
- `services/adminApi.ts` — API-клиент с mock-данными для незаконченных эндпоинтов
- `AdminLayout.tsx` — sidebar с Lucide-иконками и NavLink active-state
- `Dashboard.tsx` — 5 метрик, воронка конверсии, фильтр периода
- `DialogsList.tsx` — фильтры, пагинация, рейтинг
- `DialogDetail.tsx` — messenger-UI с ролями bot/user/manager, оценка
- `BotSettings.tsx` + 4 вкладки: Personality, Segments, Behavior, Knowledge
- `PricesList.tsx` — фильтр категорий, модал «Добавить вид работ»
- `Integrations.tsx` — RouterAI, Telegram, Яндекс Метрика, amoCRM

## Что нужно сделать (Фаза 2 — frontend)

### 2.1. Новая структура маршрутов

**Текущий `App.tsx`**:
```
/                 → LandingPage (чат-лендинг одной компании)
/admin            → AdminLayout (единая админка)
```

**Целевой `App.tsx`**:
```
/                 → PlatformLanding (маркетинговый лендинг платформы + CTA на регистрацию)
/login            → LoginPage (вход для тенантов)
/register         → RegisterPage (регистрация тенанта)
/admin            → SuperAdminLayout (панель владельца платформы)
/admin/tenants    → TenantsList (суперадмин: список всех тенантов)
/admin/tenants/:id → TenantDetail (суперадмин: детали тенанта)
/:slug            → TenantLanding (посадочная тенанта + чат — текущий LandingPage с динамическим конфигом)
/:slug/admin      → TenantAdminLayout (админка тенанта — текущая AdminLayout в контексте slug)
/:slug/admin/...  → все текущие разделы админки (dashboard, dialogs, bot, prices, integrations)
```

### 2.2. Создать новые файлы

1. **`contexts/AuthContext.tsx`** — React Context для авторизации:
   - Состояние: `{ user, token, isAuthenticated, isLoading }`
   - Методы: `login(email, password)`, `register(...)`, `logout()`, `refreshToken()`
   - При загрузке: проверить localStorage на наличие JWT
   - При expire: автоматический refresh через refreshToken

2. **`contexts/TenantContext.tsx`** — React Context для данных тенанта:
   - Загружает конфиг через GET `/api/t/:slug/config`
   - Предоставляет: `{ slug, companyName, branding, bot, segments }`
   - Показывает loading-экран пока конфиг не загружен
   - 404-экран если тенант не найден

3. **`hooks/useAuth.ts`** — хук-обёртка над AuthContext

4. **`services/authApi.ts`** — API для регистрации/логин:
   - `registerTenant(data)` → POST `/api/auth/register`
   - `loginTenant(email, password)` → POST `/api/auth/login`
   - `loginSuperAdmin(email, password)` → POST `/api/auth/superadmin`
   - `refreshTokens(refreshToken)` → POST `/api/auth/refresh`
   - `checkSlug(slug)` → GET `/api/auth/check-slug?slug=...`
   - `getTenantConfig(slug)` → GET `/api/t/:slug/config`

5. **`services/superAdminApi.ts`** — API для суперадминки:
   - `getDashboard()`, `getTenants(filters)`, `getTenantDetail(id)`
   - `updateTenant(id, data)`, `blockTenant(id)`, `unblockTenant(id)`
   - `getAuditLog(filters)`

6. **`components/guards/AuthGuard.tsx`** — обёртка маршрутов, редиректит на /login если не авторизован
7. **`components/guards/SuperAdminGuard.tsx`** — проверяет что JWT type = superadmin

8. **`pages/platform/PlatformLanding.tsx`** — маркетинговый лендинг платформы:
   - Hero: «Создайте AI-чат для расчёта сметы за 5 минут»
   - Секции: Как это работает (3 шага), Возможности, Тарифы, CTA регистрации
   - Дизайн по DESIGN.md

9. **`pages/platform/LoginPage.tsx`** — форма входа:
   - Email + пароль
   - Табы или переключатель: Тенант / Суперадмин
   - После логина тенанта → redirect на `/:slug/admin`
   - После логина суперадмина → redirect на `/admin`

10. **`pages/platform/RegisterPage.tsx`** — форма регистрации:
    - Поля: slug (с live-проверкой), company_name, email, password, city
    - Валидация на клиенте
    - После регистрации → redirect на `/:slug/admin`

11. **`pages/superadmin/SuperAdminLayout.tsx`** — layout суперадминки (sidebar: дашборд, тенанты, аудит)
12. **`pages/superadmin/SuperDashboard.tsx`** — метрики платформы (тенанты, сессии, лиды, распределение тарифов)
13. **`pages/superadmin/TenantsList.tsx`** — таблица тенантов (поиск, фильтр по тарифу/статусу, пагинация)
14. **`pages/superadmin/TenantDetail.tsx`** — детальная карточка тенанта (настройки, использование, сессии, действия)

### 2.3. Модифицировать существующие файлы

1. **`App.tsx`** — полностью переписать маршрутизацию (см. 2.1)
2. **`services/adminApi.ts`** — все вызовы через `/:slug/admin/api/` вместо `/api/admin/` (slug из TenantContext)
3. **`AdminLayout.tsx` → `TenantAdminLayout.tsx`** — обернуть в TenantContext, добавить название компании в sidebar
4. **`LandingPage.tsx`** → адаптировать как `TenantLanding` — загружать конфиг тенанта, применять динамический брендинг (цвета, тексты, логотип)
5. **`store/chatStore.ts`** — добавить `tenantSlug` для WebSocket URL (`/ws/:slug`)
6. **`types/admin.ts`** — добавить типы для auth и superadmin

### 2.4. Требования к дизайну

- Строго по `DESIGN.md` (Tailwind-токены, Lucide-иконки, rounded-2xl карточки, primary/secondary цвета)
- Light theme only
- Pill-shaped кнопки, soft shadows, generous whitespace
- Skeleton loading для всех async-данных
- Responsive (sidebar collapse на mobile)

### 2.5. Важные ограничения (из AGENTS.md / GEMINI.md)

- **Frontend**: React + Tailwind CSS + Framer Motion (уже установлены)
- **НЕ использовать** hardcoded hex-цвета — только Tailwind-токены из DESIGN.md
- **Все команды** запускать через `Set-Location frontend; ...` с `Cwd = c:\dev\ai-chat-lend` (баг с subdirectory Cwd)
- **Git**: `git commit -m "..."` + `git push origin main` — деплой автоматический через GitHub Actions
- **Проверка перед коммитом**: `npm run build` в frontend И `npx tsc --noEmit` в backend

## Порядок работы

1. Прочитать `REFACT.md` (детальная архитектура), `DESIGN.md` (дизайн-токены), `AGENTS.md` (правила)
2. Создать `services/authApi.ts` и `services/superAdminApi.ts`
3. Создать `contexts/AuthContext.tsx` и `contexts/TenantContext.tsx`
4. Создать guards (AuthGuard, SuperAdminGuard)
5. Создать страницы платформы (PlatformLanding, LoginPage, RegisterPage)
6. Создать суперадминку (SuperAdminLayout, SuperDashboard, TenantsList, TenantDetail)
7. Адаптировать TenantLanding и TenantAdminLayout
8. Обновить App.tsx с новой маршрутизацией
9. Обновить adminApi.ts для работы через /:slug/
10. Проверить build (frontend + backend), commit, push
