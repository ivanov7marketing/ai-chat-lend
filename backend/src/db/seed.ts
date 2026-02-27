/**
 * Seed script: creates default tenant + superadmin from env vars.
 * Run: npx tsx src/db/seed.ts
 *
 * Required env vars:
 *   DEFAULT_TENANT_SLUG        (default: "default")
 *   DEFAULT_TENANT_EMAIL       (default: "admin@ai-chat-lend.ru")
 *   DEFAULT_TENANT_PASSWORD    (required)
 *   DEFAULT_TENANT_COMPANY     (default: "AI Max Demo")
 *   DEFAULT_TENANT_CITY        (default: "Челябинск")
 *   SUPERADMIN_EMAIL           (required)
 *   SUPERADMIN_PASSWORD        (required)
 */

import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcrypt'
import { pool } from './client'
import { runMigrations } from './migrate'

const BCRYPT_ROUNDS = 12

async function seed() {
    console.log('Running migrations first...')
    await runMigrations()

    const slug = process.env.DEFAULT_TENANT_SLUG || 'default'
    const email = process.env.DEFAULT_TENANT_EMAIL || 'admin@ai-chat-lend.ru'
    const password = process.env.DEFAULT_TENANT_PASSWORD
    const companyName = process.env.DEFAULT_TENANT_COMPANY || 'AI Max Demo'
    const city = process.env.DEFAULT_TENANT_CITY || 'Челябинск'
    const superEmail = process.env.SUPERADMIN_EMAIL
    const superPassword = process.env.SUPERADMIN_PASSWORD

    if (!password) {
        console.error('ERROR: DEFAULT_TENANT_PASSWORD is required')
        process.exit(1)
    }
    if (!superEmail || !superPassword) {
        console.error('ERROR: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required')
        process.exit(1)
    }

    // ============================================================
    // 1. Create default tenant (idempotent)
    // ============================================================
    const existingTenant = await pool.query(
        'SELECT id FROM tenants WHERE slug = $1', [slug]
    )

    let tenantId: string

    if (existingTenant.rows.length > 0) {
        tenantId = existingTenant.rows[0].id
        console.log(`Tenant "${slug}" already exists (id: ${tenantId}), skipping creation`)
    } else {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

        const res = await pool.query(
            `INSERT INTO tenants (slug, company_name, email, password_hash, city, plan, is_active, is_verified)
             VALUES ($1, $2, $3, $4, $5, 'enterprise', TRUE, TRUE) RETURNING id`,
            [slug, companyName, email.toLowerCase(), passwordHash, city]
        )
        tenantId = res.rows[0].id
        console.log(`Created tenant "${slug}" (id: ${tenantId})`)

        // Seed tenant defaults
        await seedTenantDefaults(tenantId, companyName, city)
        console.log('Created seed data (bot settings, branding, behavior, segments, integrations)')
    }

    // ============================================================
    // 2. Migrate existing data → default tenant
    // ============================================================
    const updates = await Promise.all([
        pool.query('UPDATE sessions SET tenant_id = $1 WHERE tenant_id IS NULL', [tenantId]),
        pool.query('UPDATE leads SET tenant_id = $1 WHERE tenant_id IS NULL', [tenantId]),
        pool.query('UPDATE work_types SET tenant_id = $1 WHERE tenant_id IS NULL', [tenantId]),
        pool.query('UPDATE estimates SET tenant_id = $1 WHERE tenant_id IS NULL', [tenantId]),
    ])

    const totalMigrated = updates.reduce((sum, r) => sum + (r.rowCount ?? 0), 0)
    if (totalMigrated > 0) {
        console.log(`Migrated ${totalMigrated} existing records to tenant "${slug}"`)
    } else {
        console.log('No orphaned records to migrate')
    }

    // ============================================================
    // 3. Create superadmin (idempotent)
    // ============================================================
    const existingAdmin = await pool.query(
        'SELECT id FROM platform_admins WHERE email = $1', [superEmail.toLowerCase()]
    )

    if (existingAdmin.rows.length > 0) {
        console.log(`Superadmin "${superEmail}" already exists, skipping`)
    } else {
        const superHash = await bcrypt.hash(superPassword, BCRYPT_ROUNDS)
        await pool.query(
            `INSERT INTO platform_admins (email, password_hash, name, role, is_active)
             VALUES ($1, $2, 'Super Admin', 'superadmin', TRUE)`,
            [superEmail.toLowerCase(), superHash]
        )
        console.log(`Created superadmin "${superEmail}"`)
    }

    console.log('\nSeed complete!')
    await pool.end()
    process.exit(0)
}

async function seedTenantDefaults(tenantId: string, companyName: string, city: string) {
    // Bot Settings
    await pool.query(
        `INSERT INTO tenant_bot_settings (tenant_id, bot_name, welcome_message, quick_buttons)
         VALUES ($1, 'Макс', $2, $3)
         ON CONFLICT (tenant_id) DO NOTHING`,
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
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id) DO NOTHING`,
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
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id) DO NOTHING`,
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
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (tenant_id, name) DO NOTHING`,
            [tenantId, seg.name, seg.desc, seg.min, seg.max, seg.mats, seg.order]
        )
    }

    // Integrations (empty row)
    await pool.query(
        `INSERT INTO tenant_integrations (tenant_id) VALUES ($1)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenantId]
    )
}

seed().catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
})
