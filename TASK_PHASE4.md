# Фаза 4: Деплой, E2E-проверка, исправление багов

## Контекст проекта

Проект **ai-chat-lend** — multi-tenant SaaS платформа (чат-лендинг для расчёта сметы ремонта).
Основные документы: `GEMINI.md`, `DESIGN.md`, `AGENTS.md`, `REFACT.md`.

### Завершённые фазы

**Фаза 1 (Backend multi-tenant):**
- 12 таблиц в PostgreSQL (tenants, tenant_bot_settings, tenant_branding, tenant_segments, tenant_bot_behavior, tenant_integrations, tenant_users, platform_admins, tenant_usage, platform_audit_log + tenant_id в sessions/leads/work_types/estimates)
- Middleware: `tenantResolver.ts`, `authGuard.ts`
- Auth: `authService.ts` (register, login, refresh, slug check, seedTenantDefaults)
- Маршруты: `auth.ts`, `superAdmin.ts`, `tenantPublic.ts`

**Фаза 2 (Frontend routing & auth):**
- `AuthContext.tsx`, `TenantContext.tsx`
- Guards: `SuperAdminGuard`, `AuthGuard`
- Страницы: PlatformLanding, LoginPage, RegisterPage, SuperAdminLayout (Dashboard, TenantsList, TenantDetail, AuditLog), TenantLanding, TenantAdminLayout
- Routing: `/` (платформа), `/login`, `/register`, `/admin` (суперадмин), `/:slug` (лендинг тенанта), `/:slug/admin/*` (админ тенанта)

**Фаза 3 (Integration):**
- `tenantAdminService.ts` — 18 CRUD-функций (personality, segments, behavior, integrations, metrics, rating, branding, team, billing)
- `admin.ts` — ~20 новых эндпоинтов `/api/t/:slug/admin/*`
- `seed.ts` — скрипт инициализации (дефолтный тенант + суперадмин)
- `adminApi.ts` — удалены все MOCK-блоки, подключены реальные эндпоинты (кроме Knowledge Base)
- `tenantAdminApi.ts` — branding, team, billing API
- 3 новые страницы: TenantBranding, TenantTeam, TenantBilling
- `docker-compose.yml` — JWT env vars
- Оба билда проходят: frontend `npm run build` ✅, backend `npx tsc --noEmit` ✅

### Текущее состояние сервера

- VPS: 89.23.102.93, Ubuntu 24.04, пользователь `deploy`
- Путь: `/opt/chatbot`
- Docker Compose: postgres, backend, frontend, nginx
- Домен: ai-chat-lend.ru (SSL Let's Encrypt)
- CI/CD: `.github/workflows/deploy.yml` → git fetch+reset → docker compose build → up

---

## Задачи Фазы 4

### 1. Подготовка сервера
- [ ] Добавить в `/opt/chatbot/.env` переменные:
  ```
  JWT_SECRET=<сгенерировать>
  JWT_REFRESH_SECRET=<сгенерировать>
  SUPERADMIN_EMAIL=admin@ai-chat-lend.ru
  SUPERADMIN_PASSWORD=<задать>
  DEFAULT_TENANT_SLUG=default
  DEFAULT_TENANT_EMAIL=admin@ai-chat-lend.ru
  DEFAULT_TENANT_PASSWORD=<задать>
  DEFAULT_TENANT_COMPANY=AI Max Demo
  DEFAULT_TENANT_CITY=Челябинск
  ```
- [ ] `docker compose up -d --build`
- [ ] `docker compose exec backend npx tsx src/db/seed.ts`

### 2. Nginx — проксирование новых путей
- [ ] Проверить/обновить `nginx/nginx.conf`:
  - `/api/t/:slug/*` → backend:3001
  - `/ws/:slug` → backend:3001 (WebSocket upgrade)
  - `/api/auth/*` → backend:3001
  - `/api/superadmin/*` → backend:3001
  - Всё остальное → frontend (SPA с fallback на index.html)

### 3. E2E-проверка через браузер
- [ ] Открыть `https://ai-chat-lend.ru/` — должен показать PlatformLanding
- [ ] Открыть `https://ai-chat-lend.ru/register` — зарегистрировать тестового тенанта
- [ ] После регистрации — редирект на `/:slug/admin`
- [ ] Открыть `https://ai-chat-lend.ru/login` — войти как тенант
- [ ] Проверить все страницы тенант-админки:
  - Dashboard — реальные метрики
  - Диалоги — список + детали
  - Настройка бота — personality + segments + behavior
  - Матрица цен — таблица
  - Интеграции — формы настроек
  - Брендинг — сохранение настроек
  - Команда — добавление/удаление сотрудника
  - Биллинг — тариф + usage bars
- [ ] Открыть `https://ai-chat-lend.ru/:slug` — лендинг тенанта, чат должен работать
- [ ] Открыть `https://ai-chat-lend.ru/admin` — войти как суперадмин
  - Dashboard — метрики платформы
  - Тенанты — список, детали
  - Аудит-лог

### 4. Исправление найденных багов
- [ ] Фиксить всё что сломано по результатам E2E

### 5. Git
- [ ] Закоммитить все фиксы
- [ ] Push + Deploy

---

## Технические детали

- Backend: Fastify, TypeScript, pg (без ORM), порт 3001
- Frontend: React, Tailwind CSS, Vite
- Все команды выполнять с `Cwd = c:\dev\ai-chat-lend` (см. `.agents/workflows/run-commands.md`)
- Дизайн-система: `DESIGN.md` — никаких хардкод hex-цветов, только Tailwind-токены
