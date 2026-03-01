import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pool } from '../db/client'
import { tenantResolver, getTenantId } from '../middleware/tenantResolver'

/**
 * Маршруты публичного API тенанта (без авторизации)
 * Используются посадочной страницей для загрузки конфига
 */
export async function tenantPublicRoutes(fastify: FastifyInstance) {

    // ============ Конфиг тенанта для лендинга ============
    // GET /api/t/:slug/config
    fastify.get('/api/t/:slug/config', {
        preHandler: [tenantResolver],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)

        // Получить все данные тенанта одним запросом
        const [tenantRes, botRes, brandingRes, segmentsRes, behaviorRes, integrationsRes] = await Promise.all([
            pool.query(
                `SELECT slug, company_name, city, logo_url FROM tenants WHERE id = $1`,
                [tenantId]
            ),
            pool.query(
                `SELECT bot_name, bot_avatar_url, tone, language, welcome_message, quick_buttons, funnel_steps
                 FROM tenant_bot_settings WHERE tenant_id = $1`,
                [tenantId]
            ),
            pool.query(
                `SELECT primary_color, secondary_color, page_title, page_subtitle,
                        hero_image_url, company_description, footer_text, favicon_url, meta_description
                 FROM tenant_branding WHERE tenant_id = $1`,
                [tenantId]
            ),
            pool.query(
                `SELECT name, description, price_range_min, price_range_max
                 FROM tenant_segments WHERE tenant_id = $1 ORDER BY sort_order`,
                [tenantId]
            ),
            pool.query(
                `SELECT trigger_words, max_messages_without_cta, estimate_disclaimer
                 FROM tenant_bot_behavior WHERE tenant_id = $1`,
                [tenantId]
            ),
            pool.query(
                `SELECT yandex_metrika_counter_id
                 FROM tenant_integrations WHERE tenant_id = $1`,
                [tenantId]
            ),
        ])

        const tenant = tenantRes.rows[0] || {}
        const bot = botRes.rows[0] || {}
        const branding = brandingRes.rows[0] || {}
        const segments = segmentsRes.rows || []
        const behavior = behaviorRes.rows[0] || {}
        const integrations = integrationsRes.rows[0] || {}

        return reply.send({
            slug: tenant.slug,
            companyName: tenant.company_name,
            city: tenant.city,
            logoUrl: tenant.logo_url,
            branding: {
                primaryColor: branding.primary_color || '#22c55e',
                secondaryColor: branding.secondary_color || '#3b82f6',
                pageTitle: branding.page_title || tenant.company_name,
                pageSubtitle: branding.page_subtitle || '',
                heroImageUrl: branding.hero_image_url || null,
                companyDescription: branding.company_description || '',
                footerText: branding.footer_text || '',
                faviconUrl: branding.favicon_url || null,
                metaDescription: branding.meta_description || '',
            },
            bot: {
                name: bot.bot_name || 'Макс',
                avatarUrl: bot.bot_avatar_url || null,
                tone: bot.tone || 'friendly',
                language: bot.language || 'ru',
                welcomeMessage: bot.welcome_message || '',
                quickButtons: bot.quick_buttons || [],
            },
            segments: segments.map((s: any) => ({
                name: s.name,
                description: s.description,
                priceRangeMin: Number(s.price_range_min),
                priceRangeMax: Number(s.price_range_max),
            })),
            behavior: {
                estimateDisclaimer: behavior.estimate_disclaimer || '',
            },
            integrations: {
                ...(integrations.yandex_metrika_counter_id && {
                    yandexMetrika: { counterId: integrations.yandex_metrika_counter_id }
                })
            }
        })
    })
}
