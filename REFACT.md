# REFACT.md — Multi-Tenant SaaS-платформа

## 1. Концепция продукта

### 1.1. Текущее состояние

Приложение ai-chat-lend — **single-tenant** чат-лендинг для одной компании по ремонту квартир. AI-эксперт «Макс» ведёт пользователя через воронку расчёта сметы и собирает лид. Одна БД, один набор цен, один бот, одна админка.

### 1.2. Целевое состояние

**Multi-tenant SaaS-платформа**, позволяющая любой компании по ремонту квартир зарегистрироваться и получить:

- Персональную посадочную страницу с AI-чат-ботом
- Собственную админку для управления ботом, ценами, диалогами
- Индивидуальную настройку бренда (название, логотип, цвета, тексты)
- Свой справочник работ и матрицу цен
- Свою базу знаний (RAG)
- Свои интеграции (Telegram, CRM)

### 1.3. Бизнес-модель

| Тариф | Описание | Лимиты |
|-------|----------|--------|
| **Free** | Тестовый доступ | 50 сессий/мес, 1 пользователь админки, базовый бот |
| **Pro** | Рабочий аккаунт | 1000 сессий/мес, 3 пользователя, все настройки бота, PDF, RAG |
| **Enterprise** | Неограниченный | Без лимитов, white-label, кастомный домен, приоритетная поддержка |

---

## 2. Архитектура маршрутизации

### 2.1. Структура URL

```
https://ai-chat-lend.ru/                    → Лендинг платформы (маркетинг + регистрация)
https://ai-chat-lend.ru/login               → Вход для тенантов
https://ai-chat-lend.ru/register            → Регистрация нового тенанта
https://ai-chat-lend.ru/admin               → Суперадмин панель (владелец платформы)
https://ai-chat-lend.ru/admin/tenants       → Список всех тенантов
https://ai-chat-lend.ru/admin/tenants/:id   → Детали тенанта
https://ai-chat-lend.ru/admin/analytics     → Общая аналитика платформы
https://ai-chat-lend.ru/admin/billing       → Управление тарифами и оплатами
https://ai-chat-lend.ru/admin/settings      → Настройки платформы

https://ai-chat-lend.ru/:slug               → Посадочная страница тенанта + чат
https://ai-chat-lend.ru/:slug/admin         → Админка тенанта
https://ai-chat-lend.ru/:slug/admin/...     → Все разделы тенант-админки (дашборд, диалоги, бот, цены, интеграции)
```

### 2.2. Примеры

| Тенант | Slug | Посадочная | Админка |
|--------|------|-----------|---------|
| ООО «РемонтПро» | `remontpro` | `/remontpro` | `/remontpro/admin` |
| ИП Иванов | `maxim` | `/maxim` | `/maxim/admin` |
| СтройМастер | `stroymaster` | `/stroymaster` | `/stroymaster/admin` |

### 2.3. Зарезервированные slug'и

Следующие slug'и запрещены для регистрации (системные маршруты):

```
admin, login, register, api, ws, health, static, assets,
public, private, settings, billing, support, help, docs,
about, terms, privacy, favicon.ico, robots.txt, sitemap.xml
```

### 2.4. Кастомные домены (Enterprise)

Для тарифа Enterprise тенант может подключить свой домен:

```
https://remont.company.ru  →  проксируется на  /:slug
```

**Реализация**: таблица `custom_domains`, Nginx dynamic upstream или Caddy с автоматическим SSL.

---

## 3. База данных

### 3.1. Новые таблицы

```sql
-- ============================================================
-- Тенанты (компании-клиенты платформы)
-- ============================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,           -- URL-путь: /maxim, /remontpro
    company_name VARCHAR(255) NOT NULL,         -- «ООО РемонтПро»
    email VARCHAR(255) UNIQUE NOT NULL,         -- admin@remontpro.ru
    password_hash VARCHAR(255) NOT NULL,        -- bcrypt, cost 12
    phone VARCHAR(20),                          -- +7 900 123-45-67
    city VARCHAR(100) DEFAULT 'Челябинск',      -- город деятельности
    plan VARCHAR(20) DEFAULT 'free',            -- free / pro / enterprise
    is_active BOOLEAN DEFAULT TRUE,             -- блокировка тенанта
    is_verified BOOLEAN DEFAULT FALSE,          -- email подтверждён
    logo_url VARCHAR(500),                      -- URL логотипа в S3
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ                   -- окончание триала (14 дней)
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_email ON tenants(email);

-- ============================================================
-- Настройки бота тенанта
-- ============================================================
CREATE TABLE tenant_bot_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    bot_name VARCHAR(50) DEFAULT 'Макс',
    bot_avatar_url VARCHAR(500),
    tone VARCHAR(20) DEFAULT 'friendly',        -- professional / friendly / neutral
    language VARCHAR(5) DEFAULT 'ru',           -- ru / en
    welcome_message TEXT,
    quick_buttons JSONB DEFAULT '[]'::jsonb,    -- [{id, text, emoji, action}]
    system_prompt_override TEXT,                -- кастомный промпт (для Enterprise)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Брендинг тенанта (визуальная настройка)
-- ============================================================
CREATE TABLE tenant_branding (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color VARCHAR(7) DEFAULT '#22c55e', -- основной цвет бренда
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    page_title VARCHAR(100),                    -- заголовок посадочной
    page_subtitle VARCHAR(255),                 -- подзаголовок
    hero_image_url VARCHAR(500),                -- герой-изображение
    company_description TEXT,                   -- описание для лендинга
    footer_text TEXT,                           -- текст в подвале
    favicon_url VARCHAR(500),
    meta_description VARCHAR(300),              -- SEO
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Сегменты ремонта тенанта
-- ============================================================
CREATE TABLE tenant_segments (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- Эконом / Стандарт / Комфорт / Премиум
    description TEXT,
    what_included TEXT,
    price_range_min NUMERIC(10,2),
    price_range_max NUMERIC(10,2),
    typical_materials TEXT,
    sort_order INT DEFAULT 0,
    UNIQUE(tenant_id, name)
);

-- ============================================================
-- Поведение бота тенанта
-- ============================================================
CREATE TABLE tenant_bot_behavior (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    trigger_words JSONB DEFAULT '["дорого", "не устраивает", "менеджер"]'::jsonb,
    max_messages_without_cta INT DEFAULT 5,
    estimate_disclaimer TEXT,
    pdf_ttl_notice VARCHAR(200),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Настройки интеграций тенанта
-- ============================================================
CREATE TABLE tenant_integrations (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

    -- RouterAI (может быть общий ключ платформы или свой ключ тенанта)
    routerai_api_key VARCHAR(255),              -- NULL = используется ключ платформы
    routerai_primary_model VARCHAR(50) DEFAULT 'gpt-4o',
    routerai_fallback_model VARCHAR(50) DEFAULT 'claude-3-5-sonnet',
    routerai_daily_token_limit INT DEFAULT 100000,

    -- Telegram
    telegram_bot_token VARCHAR(255),
    telegram_chat_id VARCHAR(50),
    telegram_notification_template TEXT,

    -- Яндекс Метрика
    yandex_metrika_counter_id VARCHAR(20),
    yandex_metrika_events JSONB DEFAULT '{"chat_opened":true,"estimate_started":true,"estimate_completed":true,"lead_created":true}'::jsonb,

    -- amoCRM
    amocrm_webhook_url VARCHAR(500),
    amocrm_api_key VARCHAR(255),
    amocrm_field_mapping JSONB DEFAULT '[]'::jsonb,

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Пользователи админки тенанта (команда тенанта)
-- ============================================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'manager',         -- owner / admin / manager / content_manager
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email)
);

-- ============================================================
-- Суперадмин (владелец платформы)
-- ============================================================
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'superadmin',      -- superadmin / support
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Кастомные домены (Enterprise)
-- ============================================================
CREATE TABLE custom_domains (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,        -- remont.company.ru
    ssl_status VARCHAR(20) DEFAULT 'pending',   -- pending / active / error
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Использование ресурсов (для биллинга и лимитов)
-- ============================================================
CREATE TABLE tenant_usage (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month DATE NOT NULL,                        -- '2026-02-01' (первый день месяца)
    sessions_count INT DEFAULT 0,
    messages_count INT DEFAULT 0,
    leads_count INT DEFAULT 0,
    tokens_used BIGINT DEFAULT 0,
    pdf_generated INT DEFAULT 0,
    storage_bytes BIGINT DEFAULT 0,
    UNIQUE(tenant_id, month)
);

CREATE INDEX idx_tenant_usage_month ON tenant_usage(tenant_id, month);

-- ============================================================
-- Лог действий платформы (аудит)
-- ============================================================
CREATE TABLE platform_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL,            -- superadmin / tenant / system
    actor_id UUID,
    tenant_id UUID REFERENCES tenants(id),
    action VARCHAR(50) NOT NULL,                -- tenant.created / tenant.blocked / plan.changed / ...
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON platform_audit_log(tenant_id, created_at DESC);

-- ============================================================
-- Счета (invoices) для B2B оплаты
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV-2026-0001
  created_by VARCHAR(20) NOT NULL,            -- 'tenant' | 'superadmin'
  plan VARCHAR(20) NOT NULL,
  months INT NOT NULL,                        -- 1, 3, 6, 12
  amount NUMERIC(10,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',       -- pending, paid, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES platform_admins(id) -- кто отметил оплату
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

### 3.2. Изменения в существующих таблицах

Все существующие таблицы с данными тенантов получают `tenant_id`:

```sql
-- Сессии — ОБЯЗАТЕЛЬНО tenant_id
ALTER TABLE sessions ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id, created_at DESC);

-- Leads
ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_leads_tenant ON leads(tenant_id, created_at DESC);

-- Work Types — у каждого тенанта СВОЙ справочник работ
ALTER TABLE work_types ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_work_types_tenant ON work_types(tenant_id);

-- Estimates
ALTER TABLE estimates ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Messages — tenant_id через sessions (join), не дублируем
-- (messages.session_id → sessions.tenant_id)
```

### 3.3. Миграция текущих данных

```sql
-- Шаг 1: Создать тенанта-по-умолчанию для текущих данных
INSERT INTO tenants (id, slug, company_name, email, password_hash, plan, is_active, is_verified)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'default',
    'Текущая компания',
    'admin@ai-chat-lend.ru',
    '$2b$12$...hashed...',  -- начальный пароль
    'enterprise',
    TRUE,
    TRUE
);

-- Шаг 2: Привязать все существующие записи к дефолтному тенанту
UPDATE sessions SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL;
UPDATE work_types SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL;
UPDATE estimates SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL;

-- Шаг 3: Сделать tenant_id NOT NULL
ALTER TABLE sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE work_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE estimates ALTER COLUMN tenant_id SET NOT NULL;
```

---

## 4. Backend — изменения

### 4.1. Новая структура маршрутов

```
/backend/src
├── routes/
│   ├── auth.ts                     — НОВЫЙ: регистрация, логин, refresh token
│   ├── tenant.ts                   — НОВЫЙ: /:slug/api/* — API для тенант-лендинга
│   ├── tenantAdmin.ts              — ИЗМЕНЁН: /:slug/admin/api/* — API админки тенанта
│   ├── superAdmin.ts               — НОВЫЙ: /admin/api/* — API суперадмина
│   ├── health.ts                   — без изменений
│   └── (admin.ts удаляется, логика → tenantAdmin.ts)
├── middleware/
│   ├── tenantResolver.ts           — НОВЫЙ: определение tenant_id по slug
│   ├── authGuard.ts                — НОВЫЙ: проверка JWT (тенант / суперадмин)
│   └── rateLimiter.ts              — НОВЫЙ: rate limiting per tenant
├── services/
│   ├── authService.ts              — НОВЫЙ: регистрация, хеширование, JWT
│   ├── tenantService.ts            — НОВЫЙ: CRUD тенантов, настройки
│   ├── adminService.ts             — ИЗМЕНЁН: все запросы + WHERE tenant_id
│   ├── estimateService.ts          — ИЗМЕНЁН: + tenant_id
│   ├── leadService.ts              — ИЗМЕНЁН: + tenant_id
│   └── superAdminService.ts        — НОВЫЙ: управление платформой
├── ws/
│   └── chatHandler.ts              — ИЗМЕНЁН: tenant_id из URL slug
└── db/
    ├── client.ts                   — без изменений
    └── migrate.ts                  — ИЗМЕНЁН: новые таблицы
```

### 4.2. Tenant Resolver Middleware

```typescript
// middleware/tenantResolver.ts
// Определяет tenant_id по slug из URL

import { FastifyRequest, FastifyReply } from 'fastify'
import { pool } from '../db/client'

export async function tenantResolver(req: FastifyRequest, reply: FastifyReply) {
    const { slug } = req.params as { slug: string }

    if (!slug) {
        return reply.status(400).send({ error: 'Tenant slug required' })
    }

    const result = await pool.query(
        'SELECT id, slug, company_name, plan, is_active FROM tenants WHERE slug = $1',
        [slug]
    )

    if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Tenant not found' })
    }

    const tenant = result.rows[0]

    if (!tenant.is_active) {
        return reply.status(403).send({ error: 'Tenant is deactivated' })
    }

    // Прикрепляем tenant к запросу
    ;(req as any).tenant = tenant
    ;(req as any).tenantId = tenant.id
}
```

### 4.3. Auth Guard Middleware

```typescript
// middleware/authGuard.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

interface JWTPayload {
    type: 'tenant_owner' | 'tenant_user' | 'superadmin'
    userId: string
    tenantId?: string      // для тенант-пользователей
    role: string
}

export function authGuard(allowedTypes: JWTPayload['type'][]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        const token = req.headers.authorization?.replace('Bearer ', '')
                   || req.cookies?.auth_token

        if (!token) {
            return reply.status(401).send({ error: 'Unauthorized' })
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

            if (!allowedTypes.includes(payload.type)) {
                return reply.status(403).send({ error: 'Forbidden' })
            }

            // Для тенант-пользователей: проверить что tenant_id совпадает
            if (payload.tenantId && (req as any).tenantId) {
                if (payload.tenantId !== (req as any).tenantId) {
                    return reply.status(403).send({ error: 'Access denied to this tenant' })
                }
            }

            ;(req as any).auth = payload
        } catch {
            return reply.status(401).send({ error: 'Invalid token' })
        }
    }
}
```

### 4.4. Новые API эндпоинты

#### Аутентификация

```
POST   /api/auth/register              — Регистрация тенанта (slug, email, password, company_name, city)
POST   /api/auth/login                 — Вход тенанта → JWT (type: tenant_owner)
POST   /api/auth/login/user            — Вход сотрудника тенанта → JWT (type: tenant_user)
POST   /api/auth/login/superadmin      — Вход суперадмина → JWT (type: superadmin)
POST   /api/auth/refresh               — Обновление JWT
POST   /api/auth/forgot-password       — Восстановление пароля
POST   /api/auth/verify-email          — Подтверждение email
GET    /api/auth/me                    — Текущий пользователь
```

#### Публичный API тенанта (без авторизации, для посадочной страницы)

```
GET    /api/t/:slug/config             — Конфиг тенанта для лендинга (branding, bot settings — публичные поля)
POST   /api/t/:slug/session            — Создать сессию чата
WS     /ws/:slug                       — WebSocket для чата тенанта
```

#### Админка тенанта (с авторизацией tenant_owner / tenant_user)

```
GET    /api/t/:slug/admin/dashboard/metrics
GET    /api/t/:slug/admin/dialogs
GET    /api/t/:slug/admin/dialogs/:id
PUT    /api/t/:slug/admin/dialogs/:id/rating
GET    /api/t/:slug/admin/bot/personality
PUT    /api/t/:slug/admin/bot/personality
GET    /api/t/:slug/admin/bot/segments
PUT    /api/t/:slug/admin/bot/segments/:id
GET    /api/t/:slug/admin/bot/behavior
PUT    /api/t/:slug/admin/bot/behavior
GET    /api/t/:slug/admin/bot/knowledge
POST   /api/t/:slug/admin/bot/knowledge/upload
DELETE /api/t/:slug/admin/bot/knowledge/:id
GET    /api/t/:slug/admin/prices
PUT    /api/t/:slug/admin/prices
POST   /api/t/:slug/admin/prices
GET    /api/t/:slug/admin/branding
PUT    /api/t/:slug/admin/branding
GET    /api/t/:slug/admin/integrations
PUT    /api/t/:slug/admin/integrations/:service
POST   /api/t/:slug/admin/integrations/:service/test
GET    /api/t/:slug/admin/team               — Список сотрудников тенанта
POST   /api/t/:slug/admin/team               — Добавить сотрудника
PUT    /api/t/:slug/admin/team/:userId       — Изменить роль/статус
DELETE /api/t/:slug/admin/team/:userId       — Удалить сотрудника
GET    /api/t/:slug/admin/billing            — Текущий тариф, использование ресурсов
POST   /api/t/:slug/admin/billing/invoices   — Сформировать счёт (PDF)
GET    /api/t/:slug/admin/billing/invoices   — История своих счетов
GET    /api/t/:slug/admin/billing/invoices/:id/pdf — Скачать PDF счёта
```

#### Суперадминка (с авторизацией superadmin)

```
GET    /api/superadmin/tenants               — Список всех тенантов (с пагинацией, фильтрами)
GET    /api/superadmin/tenants/:id           — Детали тенанта
PUT    /api/superadmin/tenants/:id           — Изменить тенанта (план, статус)
DELETE /api/superadmin/tenants/:id           — Удалить тенанта
POST   /api/superadmin/tenants/:id/block     — Заблокировать
POST   /api/superadmin/tenants/:id/unblock   — Разблокировать
GET    /api/superadmin/analytics             — Агрегированная аналитика платформы
GET    /api/superadmin/analytics/revenue     — Доход по месяцам
GET    /api/superadmin/analytics/growth      — Рост тенантов
GET    /api/superadmin/usage                 — Использование ресурсов по тенантам
GET    /api/superadmin/invoices               — Все счета (фильтры)
POST   /api/superadmin/tenants/:id/invoices   — Выставить счёт вручную
PUT    /api/superadmin/invoices/:id/pay       — Отметить оплату (активация плана)
PUT    /api/superadmin/invoices/:id/cancel    — Отменить счёт
GET    /api/superadmin/invoices/:id/pdf       — Скачать PDF счёта
GET    /api/superadmin/audit-log             — Аудит-лог
GET    /api/superadmin/settings              — Настройки платформы
PUT    /api/superadmin/settings              — Обновить настройки
```

### 4.5. Data Isolation — правило для ВСЕХ запросов

**Критическое правило**: каждый SQL-запрос к данным тенанта ОБЯЗАН содержать `WHERE tenant_id = $N`.

Пример изменения в `adminService.ts`:

```typescript
// БЫЛО (single-tenant):
const res = await pool.query(
    'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
)

// СТАЛО (multi-tenant):
const res = await pool.query(
    'SELECT * FROM sessions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset]
)
```

### 4.6. WebSocket — изменения

```typescript
// БЫЛО:
// ws://ai-chat-lend.ru/ws
// { type: "session_start", utm: {} }

// СТАЛО:
// ws://ai-chat-lend.ru/ws/:slug
// slug определяет tenant_id
// { type: "session_start", utm: {} }

// Сервер при подключении:
// 1. Извлекает slug из URL
// 2. Находит tenant_id по slug
// 3. Проверяет is_active
// 4. Проверяет лимиты (sessions_count < plan_limit)
// 5. Создаёт сессию с tenant_id
```

### 4.7. Лимиты и квоты

```typescript
// services/limitsService.ts

const PLAN_LIMITS = {
    free: {
        sessions_per_month: 50,
        team_members: 1,
        tokens_per_day: 10000,
        rag_documents: 3,
        storage_mb: 50,
        pdf_per_month: 10,
        custom_domain: false,
        white_label: false,
    },
    pro: {
        sessions_per_month: 1000,
        team_members: 3,
        tokens_per_day: 500000,
        rag_documents: 50,
        storage_mb: 500,
        pdf_per_month: 500,
        custom_domain: false,
        white_label: false,
    },
    enterprise: {
        sessions_per_month: Infinity,
        team_members: Infinity,
        tokens_per_day: Infinity,
        rag_documents: Infinity,
        storage_mb: 10000,
        pdf_per_month: Infinity,
        custom_domain: true,
        white_label: true,
    },
}

export async function checkLimit(tenantId: string, resource: string): Promise<boolean> {
    // 1. Получить план тенанта
    // 2. Получить текущее использование из tenant_usage
    // 3. Сравнить с лимитом
    // 4. Вернуть true если НЕ превышен
}

export async function incrementUsage(tenantId: string, resource: string, amount: number = 1): Promise<void> {
    // UPSERT в tenant_usage для текущего месяца
}

### 4.8. Контроль подписок и Cron-задачи

Для B2B-модели с ручным подтверждением оплаты:

1. **tenant_invoices**: Генерируются через Puppeteer с использованием шаблона `assets/invoice_template.html`.
2. **Cron-задача (`services/planExpiryJob.ts`)**: Запускается ежедневно через `node-cron '0 3 * * *'`.
   - Проверяет `plan_expires_at` в таблице `tenants`.
   - За 7 и 3 дня отправляет уведомления тенанту и суперадмину через SMTP (Nodemailer).
   - При истечении срока — `UPDATE tenants SET plan = 'free', plan_expires_at = NULL`.
3. **Активация**: При вызове суперадмином `PUT /api/superadmin/invoices/:id/pay`, обновляется запись тенанта: `plan_expires_at = NOW() + interval 'X months'`.
```

---

## 5. Frontend — изменения

### 5.1. Новая структура маршрутов React Router

```tsx
<BrowserRouter>
    <Routes>
        {/* ===== Публичные маршруты платформы ===== */}
        <Route path="/" element={<PlatformLanding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ===== Суперадмин ===== */}
        <Route path="/admin" element={<SuperAdminGuard><SuperAdminLayout /></SuperAdminGuard>}>
            <Route index element={<SuperDashboard />} />
            <Route path="tenants" element={<TenantsList />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="billing" element={<PlatformBilling />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<PlatformSettings />} />
        </Route>

        {/* ===== Тенант: посадочная страница + чат ===== */}
        <Route path="/:slug" element={<TenantLanding />} />

        {/* ===== Тенант: админка ===== */}
        <Route path="/:slug/admin" element={<TenantAuthGuard><TenantAdminLayout /></TenantAuthGuard>}>
            <Route index element={<TenantDashboard />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="dialogs" element={<TenantDialogsList />} />
            <Route path="dialogs/:id" element={<TenantDialogDetail />} />
            <Route path="bot" element={<TenantBotSettings />} />
            <Route path="prices" element={<TenantPricesList />} />
            <Route path="integrations" element={<TenantIntegrations />} />
            <Route path="branding" element={<TenantBranding />} />
            <Route path="team" element={<TenantTeam />} />
            <Route path="billing" element={<TenantBilling />} />
        </Route>
    </Routes>
</BrowserRouter>
```

### 5.2. Новая файловая структура

```
/frontend/src
├── pages/
│   ├── platform/                           — НОВЫЕ: страницы платформы
│   │   ├── PlatformLanding.tsx             — Лендинг с формой регистрации
│   │   ├── LoginPage.tsx                   — Вход (тенант / суперадмин)
│   │   └── RegisterPage.tsx                — Регистрация тенанта
│   │
│   ├── superadmin/                         — НОВЫЕ: суперадмин
│   │   ├── SuperAdminLayout.tsx            — Layout суперадмина
│   │   ├── SuperDashboard.tsx              — Дашборд платформы
│   │   ├── TenantsList.tsx                 — Таблица всех тенантов
│   │   ├── TenantDetail.tsx                — Детали тенанта
│   │   ├── PlatformAnalytics.tsx           — Аналитика платформы
│   │   ├── PlatformBilling.tsx             — Биллинг
│   │   ├── AuditLog.tsx                    — Аудит-лог
│   │   └── PlatformSettings.tsx            — Настройки
│   │
│   ├── tenant/                             — ПЕРЕИМЕНОВАНО из admin/
│   │   ├── TenantAdminLayout.tsx           — Layout (= текущий AdminLayout + slug context)
│   │   ├── TenantDashboard.tsx             — (= текущий Dashboard)
│   │   ├── TenantDialogsList.tsx           — (= текущий DialogsList)
│   │   ├── TenantDialogDetail.tsx          — (= текущий DialogDetail)
│   │   ├── TenantBotSettings.tsx           — (= текущий BotSettings)
│   │   ├── TenantPricesList.tsx            — (= текущий PricesList)
│   │   ├── TenantIntegrations.tsx          — (= текущий Integrations)
│   │   ├── TenantBranding.tsx              — НОВЫЙ: настройка внешнего вида лендинга
│   │   ├── TenantTeam.tsx                  — НОВЫЙ: управление сотрудниками
│   │   ├── TenantBilling.tsx               — НОВЫЙ: тариф, лимиты, оплата
│   │   └── tabs/                           — (текущие табы: BotPersonality, BotSegments, ...)
│   │
│   └── LandingPage.tsx                     — УДАЛИТЬ (заменён на TenantLanding)
│
├── contexts/
│   ├── AuthContext.tsx                      — НОВЫЙ: JWT, user/tenant info
│   └── TenantContext.tsx                   — НОВЫЙ: tenant slug, config, branding
│
├── components/
│   ├── guards/
│   │   ├── SuperAdminGuard.tsx             — НОВЫЙ: проверка superadmin JWT
│   │   └── TenantAuthGuard.tsx             — НОВЫЙ: проверка tenant JWT
│   ├── chat/                               — без изменений (переиспользуется)
│   └── ui/                                 — НОВЫЕ: переиспользуемые компоненты
│       ├── Modal.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       └── StatusBadge.tsx
│
├── services/
│   ├── api.ts                              — без изменений (для чата)
│   ├── adminApi.ts                         — ИЗМЕНЁН: все вызовы через /:slug/admin/api/
│   ├── authApi.ts                          — НОВЫЙ: register, login, refresh
│   ├── superAdminApi.ts                    — НОВЫЙ: API суперадмина
│   └── tenantPublicApi.ts                  — НОВЫЙ: GET /:slug/config
│
├── hooks/
│   ├── useAuth.ts                          — НОВЫЙ: login/logout/isAuthenticated
│   ├── useTenant.ts                        — НОВЫЙ: текущий tenant из URL slug
│   └── usePermissions.ts                   — НОВЫЙ: проверка прав по роли
│
├── types/
│   ├── chat.ts                             — без изменений
│   ├── admin.ts                            — ИЗМЕНЁН: + tenant-specific типы
│   └── auth.ts                             — НОВЫЙ: User, Tenant, JWTPayload
│
└── store/
    └── chatStore.ts                        — ИЗМЕНЁН: хранит tenant slug для API-вызовов
```

### 5.3. Tenant Context

```tsx
// contexts/TenantContext.tsx

interface TenantConfig {
    id: string;
    slug: string;
    companyName: string;
    city: string;
    plan: string;
    branding: {
        primaryColor: string;
        secondaryColor: string;
        pageTitle: string;
        pageSubtitle: string;
        heroImageUrl: string;
        companyDescription: string;
        logoUrl: string;
    };
    botSettings: {
        botName: string;
        botAvatarUrl: string;
        welcomeMessage: string;
        quickButtons: QuickButton[];
    };
}

const TenantContext = createContext<TenantConfig | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { slug } = useParams();
    const [config, setConfig] = useState<TenantConfig | null>(null);

    useEffect(() => {
        // GET /api/t/:slug/config
        fetchTenantConfig(slug!).then(setConfig);
    }, [slug]);

    if (!config) return <TenantLoadingScreen />;

    return (
        <TenantContext.Provider value={config}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error('useTenant must be used within TenantProvider');
    return ctx;
}
```

### 5.4. Динамический брендинг

Посадочная страница тенанта применяет CSS-переменные из конфига:

```tsx
// pages/tenant/TenantLanding.tsx

function TenantLanding() {
    const tenant = useTenant();

    // Динамические CSS-переменные
    const style = {
        '--brand-primary': tenant.branding.primaryColor,
        '--brand-secondary': tenant.branding.secondaryColor,
    } as React.CSSProperties;

    return (
        <div style={style}>
            <header>
                <img src={tenant.branding.logoUrl} alt={tenant.companyName} />
                <h1>{tenant.branding.pageTitle}</h1>
                <p>{tenant.branding.pageSubtitle}</p>
            </header>
            {/* Чат-виджет с настройками тенанта */}
            <ChatWindow
                botName={tenant.botSettings.botName}
                botAvatar={tenant.botSettings.botAvatarUrl}
                welcomeMessage={tenant.botSettings.welcomeMessage}
                quickButtons={tenant.botSettings.quickButtons}
                wsUrl={`/ws/${tenant.slug}`}
            />
        </div>
    );
}
```

---

## 6. Суперадмин панель

### 6.1. Дашборд платформы

**Метрики**:

| Метрика | Описание |
|---------|----------|
| Всего тенантов | Количество зарегистрированных компаний |
| Активных тенантов | Тенанты с >= 1 сессией за последние 30 дней |
| Новых за период | Регистрации за выбранный период |
| Всего сессий (платформа) | Суммарно по всем тенантам |
| Всего лидов (платформа) | Суммарно |
| MRR (Monthly Recurring Revenue) | Суммарный доход по оплаченным тарифам |
| Churn rate | % тенантов перешедших на free или деактивированных |
| Токены использовано | Суммарный расход RouterAI за месяц |

**Графики**:
- Рост тенантов по неделям (линейный)
- Распределение по тарифам (pie chart)
- Топ-10 тенантов по сессиям (horizontal bars)

### 6.2. Список тенантов

**Таблица**:

| Столбец | Описание |
|---------|----------|
| Компания | company_name + slug |
| Email | email владельца |
| Тариф | free / pro / enterprise (badge) |
| Статус | Активен / Заблокирован / Не подтверждён |
| Сессий за месяц | из tenant_usage |
| Лидов за месяц | из tenant_usage |
| Дата регистрации | created_at |
| Последний вход | last_login_at |

**Действия**:
- Просмотр деталей (переход к TenantDetail)
- Изменить тариф
- Заблокировать / Разблокировать
- Войти как тенант (impersonation)
- Удалить (с подтверждением)

### 6.3. Детали тенанта

**Информация**:
- Все поля из `tenants`
- Настройки бота, брендинг, интеграции (read-only)
- Список сотрудников
- Использование ресурсов (сессии, токены, PDF, хранилище — график по месяцам)
- Последние 20 сессий
- Аудит-лог действий тенанта

**Действия суперадмина**:
- Изменить тариф
- Установить кастомные лимиты (override поверх тарифа)
- Заблокировать/разблокировать
- Сбросить пароль
- Войти как тенант (генерирует временный JWT)

---

## 7. Новые страницы тенант-админки

### 7.1. Брендинг (`/:slug/admin/branding`)

Управление внешним видом посадочной страницы:

| Поле | Тип | Описание |
|------|-----|----------|
| Логотип | Загрузка изображения | PNG/SVG, макс. 200 КБ |
| Основной цвет | Color picker | Цвет кнопок и акцентов |
| Вторичный цвет | Color picker | Дополнительный цвет |
| Заголовок страницы | Input, макс. 100 символов | «Ремонт квартир в Челябинске» |
| Подзаголовок | Input, макс. 255 символов | «Рассчитаем стоимость за 5 минут» |
| Изображение героя | Загрузка | JPG/PNG, рекомендуемый 1200×600 |
| Описание компании | Textarea | Для блока «О компании» |
| Текст подвала | Textarea | Юридическая информация |
| Meta description | Input, макс. 300 | SEO |

**Живой предпросмотр**: справа от формы показывается preview посадочной страницы с применёнными стилями.

### 7.2. Команда (`/:slug/admin/team`)

Управление сотрудниками тенанта:

| Столбец | Описание |
|---------|----------|
| Имя | name |
| Email | email |
| Роль | owner / admin / manager / content_manager |
| Статус | Активен / Деактивирован |
| Последний вход | last_login_at |

**Роли**: идентичны описанным в ADMINPANEL.md §6.1, но привязаны к тенанту.

**Ограничения по тарифу**:
- Free: 1 пользователь (только owner)
- Pro: до 3 пользователей
- Enterprise: без лимита

### 7.3. Биллинг (`/:slug/admin/billing`)

- Текущий тариф (с описанием лимитов)
- Использование за текущий месяц (прогресс-бары):
  - Сессий: 124 / 1000
  - Токенов: 345K / 500K
  - Хранилище: 23 МБ / 500 МБ
  - PDF: 45 / 500
  - Сотрудников: 2 / 3
- Кнопка «Сменить тариф» → модальное окно с тарифами
- История оплат (если подключена оплата)
- Форма выбора плана (Pro/Enterprise) + срок (1/3/6/12 мес)
- Кнопка «Сформировать счёт» → INV-PDF
- История выставленных счетов со статусами (Оплачен / Ожидает / Отменён)

---

## 8. Посадочная страница платформы

### 8.1. Структура (`/`)

Текущий `LandingPage.tsx` заменяется на маркетинговый лендинг **платформы**:

1. **Hero** — «Создайте AI-чат для расчёта сметы за 5 минут» + CTA «Зарегистрироваться бесплатно»
2. **Как это работает** — 3 шага: Регистрация → Настройка бота → Получение лидов
3. **Что получает компания** — Список фичей (AI-бот, воронка, PDF, CRM, Telegram)
4. **Тарифы** — 3 карточки (Free / Pro / Enterprise) с ценами и фичами
5. **Отзывы / Кейсы** — Примеры компаний, использующих платформу (mock)
6. **FAQ** — Частые вопросы
7. **Footer** — Контакты, ссылки, юридическая информация

### 8.2. Форма регистрации (`/register`)

**Поля**:

| Поле | Валидация |
|------|-----------|
| Название компании | Обязательное, 3-255 символов |
| Slug (URL) | Обязательное, 3-50 символов, [a-z0-9-], уникальность (проверка в реальном времени) |
| Email | Обязательное, формат email, уникальность |
| Пароль | Обязательное, >= 8 символов, буквы + цифры |
| Город | Обязательное, выбор из списка или ввод |
| Согласие | Чекбокс: «Принимаю условия использования» |

**Процесс**:
1. Пользователь заполняет форму → POST `/api/auth/register`
2. Backend создаёт тенанта + owner'а + дефолтные настройки (бот, сегменты, поведение)
3. Отправляется email с подтверждением
4. Пользователь перенаправляется на `/:slug/admin` (первичная настройка)
5. При первом входе — wizard: загрузка логотипа, настройка приветствия, добавление видов работ

---

## 9. Безопасность

### 9.1. Аутентификация

- **JWT-токены**: access token (15 мин) + refresh token (7 дней, HTTP-only cookie)
- **Три типа токенов**: `tenant_owner`, `tenant_user`, `superadmin`
- **bcrypt**: cost factor 12 для хеширования паролей
- **Email verification**: обязательное подтверждение email перед активацией

### 9.2. Авторизация (RBAC)

```
superadmin     → полный доступ ко всему
tenant_owner   → полный доступ к своему тенанту, биллинг, команда
tenant_admin   → всё кроме биллинга и удаления тенанта
tenant_manager → дашборд, диалоги (просмотр + подключение), настройки бота (read-only)
tenant_content → база знаний, справочник цен
```

### 9.3. Data Isolation

- **Row-level**: `tenant_id` во всех запросах (middleware автоматически добавляет фильтр)
- **CORS**: разрешены только домены тенантов (динамическая проверка по `custom_domains`)
- **Rate limiting**: per-tenant (free: 60 req/min, pro: 300 req/min, enterprise: 1000 req/min)
- **Input sanitization**: все пользовательские данные (slug, тексты, шаблоны) проходят санитизацию

### 9.4. Импeрсонация (Superadmin)

Суперадмин может «войти как тенант» для диагностики:
- Генерируется временный JWT (type: `tenant_owner`, ttl: 30 мин)
- В UI показывается заметный баннер «Вы вошли как [company_name]»
- Все действия логируются в `platform_audit_log`

---

## 10. Seed-данные для новых тенантов

При регистрации нового тенанта автоматически создаются:

### 10.1. Настройки бота

```json
{
    "bot_name": "Макс",
    "tone": "friendly",
    "language": "ru",
    "welcome_message": "Привет! Я Макс — AI-эксперт по ремонту квартир в {city}.\nПомогу рассчитать примерную стоимость ремонта.\n\nС чего начнём?",
    "quick_buttons": [
        {"text": "Рассчитать стоимость", "emoji": "🧮", "action": "start_funnel"},
        {"text": "Узнать сроки", "emoji": "📅", "action": "ask_kb"},
        {"text": "О компании", "emoji": "🏢", "action": "ask_kb"},
        {"text": "Задать вопрос", "emoji": "❓", "action": "custom"}
    ]
}
```

### 10.2. Сегменты (4 шт., с template-значениями)

Копируются из дефолтного шаблона с ценами, характерными для указанного города.

### 10.3. Поведение бота

```json
{
    "trigger_words": ["дорого", "не устраивает", "менеджер"],
    "max_messages_without_cta": 5,
    "estimate_disclaimer": "Смета ориентировочная. Точная стоимость — после замера.",
    "pdf_ttl_notice": "Ссылка на PDF активна 72 часа."
}
```

### 10.4. Брендинг

```json
{
    "primary_color": "#22c55e",
    "secondary_color": "#3b82f6",
    "page_title": "{company_name} — ремонт квартир",
    "page_subtitle": "Рассчитайте стоимость ремонта за 5 минут",
    "company_description": "",
    "meta_description": "Расчёт стоимости ремонта квартиры в {city}. AI-калькулятор сметы."
}
```

---

## 11. Хранилище файлов

### 11.1. Структура S3 (Yandex Object Storage)

```
/tenants/
    /{tenant_id}/
        /logo/
            logo.png
            favicon.ico
        /hero/
            hero.jpg
        /bot/
            avatar.png
        /pdfs/
            {estimate_id}.pdf
        /rag/
            {document_id}_original.pdf
            {document_id}_chunks.json
```

### 11.2. Квоты хранилища

- Free: 50 MB
- Pro: 500 MB
- Enterprise: 10 GB

---

## 12. Этапы реализации

### Фаза 1: Фундамент (неделя 1-2)

- [ ] Миграция БД: новые таблицы, `tenant_id` в существующих
- [ ] `tenantResolver` middleware
- [ ] `authGuard` middleware
- [ ] Auth API: регистрация / логин / JWT
- [ ] Seed-данные для новых тенантов
- [ ] Миграция текущих данных → дефолтный тенант
- [ ] Тесты: регистрация тенанта, создание сессии с tenant_id

### Фаза 2: Тенант-маршрутизация (неделя 2-3)

- [ ] Backend: все запросы через `/:slug/` + data isolation
- [ ] Frontend: `TenantContext`, `AuthContext`, `useAuth`, `useTenant`
- [ ] Frontend: `TenantLanding` — динамическая загрузка конфига тенанта
- [ ] Frontend: `TenantAdminLayout` — текущая админка в контексте slug
- [ ] WebSocket: подключение через `/ws/:slug`
- [ ] Тесты: два тенанта → изолированные данные

### Фаза 3: Платформа (неделя 3-4)

- [ ] Frontend: PlatformLanding (маркетинговый лендинг)
- [ ] Frontend: RegisterPage, LoginPage
- [ ] Frontend: Первичный wizard настройки для нового тенанта
- [ ] Backend: лимиты и квоты (limitsService)
- [ ] Backend: tenant_usage — учёт потребления ресурсов
- [ ] Тесты: регистрация → настройка → первая сессия чата

### Фаза 4: Суперадмин (неделя 4-5)

- [ ] Frontend: SuperAdminLayout
- [ ] Frontend: TenantsList, TenantDetail
- [ ] Frontend: PlatformAnalytics (дашборд платформы)
- [ ] Backend: суперадмин API (список тенантов, блокировка, импeрсонация)
- [ ] Backend: аудит-лог
- [ ] Тесты: суперадмин может просматривать и управлять тенантами

### Фаза 5: Брендинг и биллинг (неделя 5-6)

- [ ] Frontend: TenantBranding (настройка внешнего вида)
- [ ] Frontend: TenantTeam (управление сотрудниками)
- [ ] Frontend: TenantBilling (тариф, использование)
- [ ] Backend: S3-изоляция файлов по тенантам
- [ ] Backend: биллинг API (если подключена оплата)
- [ ] Enterprise: кастомные домены

### Фаза 6: Полировка и деплой (неделя 6-7)

- [ ] Email-верификация (SendPulse / Mailgun)
- [ ] Rate limiting per tenant
- [ ] Security audit (OWASP checklist)
- [ ] Performance: кеширование конфигов тенантов в Redis
- [ ] Нагрузочное тестирование (10+ тенантов одновременно)
- [ ] Документация для тенантов (onboarding guide)
- [ ] Деплой на production

---

## 13. Инфраструктура

### 13.1. Docker Compose — изменения

```yaml
services:
  # Без изменений: postgres, qdrant
  # Изменения:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - S3_BUCKET=${S3_BUCKET}
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - PLATFORM_ROUTERAI_KEY=${PLATFORM_ROUTERAI_KEY}  # ключ платформы (для free-тенантов)
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}

  # Возможно: Redis для кеширования
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 13.2. Nginx — изменения

```nginx
# Все маршруты → один React SPA (уже работает)
# Добавить:
# - WebSocket маршрут /ws/:slug
# - Проксирование кастомных доменов

server {
    listen 443 ssl;
    server_name ai-chat-lend.ru *.ai-chat-lend.ru;

    # SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://backend:3000;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Кастомные домены (Enterprise)
# Решается через Caddy или отдельный Nginx upstream с dynamic SSL
```

---

## 14. Риски и ограничения

| Риск | Описание | Митигация |
|------|----------|-----------|
| **Утечка данных** | Тенант видит данные другого тенанта | Row-level isolation + middleware + интеграционные тесты |
| **Noisy neighbor** | Один тенант потребляет все ресурсы LLM | Per-tenant rate limiting + token quotas |
| **Slug collision** | `/admin` vs `/:slug` — конфликт маршрутов | Зарезервированный список slug'ов |
| **Масштабирование** | 100+ тенантов × 1000 сессий/мес | Индексы БД, Redis кеш, горизонтальное масштабирование |
| **Billing complexity** | Сложность подключения оплаты | Начать с ручного управления тарифами через суперадмин |
| **Onboarding** | Тенант не понимает как настроить бота | Wizard при первом входе + документация + шаблоны |

---

## 15. Метрики успеха

| Метрика | Цель (3 мес) | Цель (6 мес) |
|---------|-------------|-------------|
| Зарегистрированных тенантов | 20 | 100 |
| Активных тенантов (>1 сессия/мес) | 10 | 50 |
| Pro-подписок | 3 | 15 |
| Средний жизненный цикл тенанта | 2+ мес | 4+ мес |
| Uptime платформы | 99.5% | 99.9% |
