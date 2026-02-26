import bcrypt from 'bcrypt'
import { pool } from '../db/client'
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    JWTPayload,
} from '../middleware/authGuard'

const BCRYPT_ROUNDS = 12

const RESERVED_SLUGS = new Set([
    'admin', 'login', 'register', 'api', 'ws', 'health',
    'static', 'assets', 'public', 'private', 'settings',
    'billing', 'support', 'help', 'docs', 'about', 'terms',
    'privacy', 'favicon.ico', 'robots.txt', 'sitemap.xml',
])

// ============================================================
// Регистрация тенанта
// ============================================================

export interface RegisterInput {
    slug: string
    companyName: string
    email: string
    password: string
    phone?: string
    city?: string
}

export interface RegisterResult {
    tenantId: string
    slug: string
    accessToken: string
    refreshToken: string
}

export async function registerTenant(input: RegisterInput): Promise<RegisterResult> {
    const { slug, companyName, email, password, phone, city } = input

    // Валидация slug
    const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (slugClean.length < 3 || slugClean.length > 50) {
        throw new AuthError('Slug должен содержать 3-50 символов (a-z, 0-9, -)')
    }
    if (RESERVED_SLUGS.has(slugClean)) {
        throw new AuthError('Этот адрес зарезервирован системой')
    }

    // Проверить уникальность slug
    const slugCheck = await pool.query(
        'SELECT id FROM tenants WHERE slug = $1', [slugClean]
    )
    if (slugCheck.rows.length > 0) {
        throw new AuthError('Этот адрес уже занят')
    }

    // Проверить уникальность email
    const emailCheck = await pool.query(
        'SELECT id FROM tenants WHERE email = $1', [email.toLowerCase()]
    )
    if (emailCheck.rows.length > 0) {
        throw new AuthError('Email уже зарегистрирован')
    }

    // Хешировать пароль
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Создать тенанта
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14) // 14 дней триал

    const res = await pool.query(
        `INSERT INTO tenants (slug, company_name, email, password_hash, phone, city, trial_ends_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [slugClean, companyName, email.toLowerCase(), passwordHash, phone || null, city || 'Челябинск', trialEnds]
    )

    const tenantId = res.rows[0].id as string

    // Создать seed-данные для тенанта
    await seedTenantDefaults(tenantId, companyName, city || 'Челябинск')

    // Генерировать JWT
    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        type: 'tenant_owner',
        userId: tenantId, // owner = сам тенант
        tenantId,
        role: 'owner',
        email: email.toLowerCase(),
    }

    return {
        tenantId,
        slug: slugClean,
        accessToken: generateAccessToken(tokenPayload),
        refreshToken: generateRefreshToken(tokenPayload),
    }
}

// ============================================================
// Seed-данные для нового тенанта
// ============================================================

async function seedTenantDefaults(tenantId: string, companyName: string, city: string) {
    // Bot Settings
    await pool.query(
        `INSERT INTO tenant_bot_settings (tenant_id, bot_name, welcome_message, quick_buttons)
         VALUES ($1, 'Макс', $2, $3)`,
        [
            tenantId,
            `Привет! Я Макс — AI-эксперт по ремонту квартир в ${city}.\nПомогу рассчитать примерную стоимость ремонта, расскажу о технологиях\nи отвечу на любые вопросы.\n\nС чего начнём?`,
            JSON.stringify([
                { id: '1', text: 'Рассчитать стоимость ремонта', emoji: '🧮', action: 'start_funnel' },
                { id: '2', text: 'Узнать сроки ремонта', emoji: '📅', action: 'ask_kb' },
                { id: '3', text: 'О компании и гарантиях', emoji: '🏢', action: 'ask_kb' },
                { id: '4', text: 'Задать свой вопрос', emoji: '❓', action: 'custom' },
            ]),
        ]
    )

    // Branding
    await pool.query(
        `INSERT INTO tenant_branding (tenant_id, page_title, page_subtitle, meta_description)
         VALUES ($1, $2, $3, $4)`,
        [
            tenantId,
            `${companyName} — ремонт квартир в ${city}`,
            'Рассчитайте стоимость ремонта за 5 минут с помощью AI',
            `Расчёт стоимости ремонта квартиры в ${city}. AI-калькулятор сметы от ${companyName}.`,
        ]
    )

    // Bot Behavior
    await pool.query(
        `INSERT INTO tenant_bot_behavior (tenant_id, estimate_disclaimer, pdf_ttl_notice)
         VALUES ($1, $2, $3)`,
        [
            tenantId,
            'Данная смета является ориентировочной. Точная стоимость определяется после бесплатного замера.',
            'Ссылка на PDF активна 72 часа. Сохраните файл, если понадобится позже.',
        ]
    )

    // Default Segments
    const segments = [
        { name: 'Эконом', desc: 'Базовый ремонт с сертифицированными материалами эконом-класса.', min: 15000, max: 22000, mats: 'Knauf, Ceresit, Tarkett', order: 1 },
        { name: 'Стандарт', desc: 'Качественный ремонт с оптимальным соотношением цены и результата.', min: 22000, max: 35000, mats: 'Knauf, Weber Vetonit, Quick-Step, Grohe', order: 2 },
        { name: 'Комфорт', desc: 'Ремонт повышенного качества с дизайнерскими решениями.', min: 35000, max: 55000, mats: 'Kerama Marazzi, Hansgrohe, Quick-Step Impressive', order: 3 },
        { name: 'Премиум', desc: 'Эксклюзивный ремонт с полным дизайн-проектом и топовыми материалами.', min: 55000, max: 100000, mats: 'Duravit, Villeroy & Boch, Rimadesio', order: 4 },
    ]
    for (const seg of segments) {
        await pool.query(
            `INSERT INTO tenant_segments (tenant_id, name, description, price_range_min, price_range_max, typical_materials, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [tenantId, seg.name, seg.desc, seg.min, seg.max, seg.mats, seg.order]
        )
    }

    // Integrations (пустые, чтобы запись была)
    await pool.query(
        `INSERT INTO tenant_integrations (tenant_id) VALUES ($1)`,
        [tenantId]
    )
}

// ============================================================
// Логин тенанта (owner)
// ============================================================

export interface LoginInput {
    email: string
    password: string
}

export interface LoginResult {
    tenantId: string
    slug: string
    companyName: string
    accessToken: string
    refreshToken: string
}

export async function loginTenant(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input

    const res = await pool.query(
        `SELECT id, slug, company_name, email, password_hash, is_active
         FROM tenants WHERE email = $1`,
        [email.toLowerCase()]
    )

    if (res.rows.length === 0) {
        throw new AuthError('Неверный email или пароль')
    }

    const tenant = res.rows[0]

    if (!tenant.is_active) {
        throw new AuthError('Аккаунт деактивирован. Обратитесь в поддержку.')
    }

    const valid = await bcrypt.compare(password, tenant.password_hash)
    if (!valid) {
        throw new AuthError('Неверный email или пароль')
    }

    // Обновить last_login_at
    await pool.query(
        'UPDATE tenants SET last_login_at = NOW() WHERE id = $1',
        [tenant.id]
    )

    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        type: 'tenant_owner',
        userId: tenant.id,
        tenantId: tenant.id,
        role: 'owner',
        email: tenant.email,
    }

    return {
        tenantId: tenant.id,
        slug: tenant.slug,
        companyName: tenant.company_name,
        accessToken: generateAccessToken(tokenPayload),
        refreshToken: generateRefreshToken(tokenPayload),
    }
}

// ============================================================
// Логин суперадмина
// ============================================================

export async function loginSuperAdmin(input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = input

    const res = await pool.query(
        `SELECT id, email, password_hash, name, role, is_active
         FROM platform_admins WHERE email = $1`,
        [email.toLowerCase()]
    )

    if (res.rows.length === 0) {
        throw new AuthError('Неверный email или пароль')
    }

    const admin = res.rows[0]

    if (!admin.is_active) {
        throw new AuthError('Аккаунт деактивирован')
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
        throw new AuthError('Неверный email или пароль')
    }

    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        type: 'superadmin',
        userId: admin.id,
        role: admin.role,
        email: admin.email,
    }

    return {
        accessToken: generateAccessToken(tokenPayload),
        refreshToken: generateRefreshToken(tokenPayload),
    }
}

// ============================================================
// Refresh Token
// ============================================================

export function refreshTokens(refreshToken: string): { accessToken: string; refreshToken: string } {
    const payload = verifyRefreshToken(refreshToken)

    const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        type: payload.type,
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
    }

    return {
        accessToken: generateAccessToken(newPayload),
        refreshToken: generateRefreshToken(newPayload),
    }
}

// ============================================================
// Проверка доступности slug
// ============================================================

export async function checkSlugAvailability(slug: string): Promise<boolean> {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (clean.length < 3 || RESERVED_SLUGS.has(clean)) return false
    const res = await pool.query('SELECT id FROM tenants WHERE slug = $1', [clean])
    return res.rows.length === 0
}

// ============================================================
// Кастомная ошибка авторизации
// ============================================================

export class AuthError extends Error {
    statusCode: number
    constructor(message: string, statusCode = 400) {
        super(message)
        this.name = 'AuthError'
        this.statusCode = statusCode
    }
}
