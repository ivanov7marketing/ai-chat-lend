import { pool } from '../db/client'
import { PLAN_LIMITS } from '../config/limits'
import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12

// ============================================================
// Bot Personality (tenant_bot_settings)
// ============================================================

export async function getBotPersonality(tenantId: string) {
    const res = await pool.query(
        `SELECT bot_name, bot_avatar_url, tone, language, welcome_message, quick_buttons, system_prompt_override, is_white_label
         FROM tenant_bot_settings WHERE tenant_id = $1`,
        [tenantId]
    )
    if (res.rows.length === 0) return null

    const row = res.rows[0]
    return {
        name: row.bot_name,
        avatarUrl: row.bot_avatar_url,
        tone: row.tone,
        language: row.language,
        welcomeMessage: row.welcome_message,
        quickButtons: row.quick_buttons || [],
        isWhiteLabel: row.is_white_label || false,
    }
}

export async function updateBotPersonality(
    tenantId: string,
    data: {
        name?: string
        tone?: string
        language?: string
        welcomeMessage?: string
        quickButtons?: any[]
        isWhiteLabel?: boolean
    }
) {
    await pool.query(
        `UPDATE tenant_bot_settings
         SET bot_name = COALESCE($2, bot_name),
             tone = COALESCE($3, tone),
             language = COALESCE($4, language),
             welcome_message = COALESCE($5, welcome_message),
             quick_buttons = COALESCE($6, quick_buttons),
             is_white_label = COALESCE($7, is_white_label),
             updated_at = NOW()
         WHERE tenant_id = $1`,
        [
            tenantId,
            data.name || null,
            data.tone || null,
            data.language || null,
            data.welcomeMessage || null,
            data.quickButtons ? JSON.stringify(data.quickButtons) : null,
            data.isWhiteLabel !== undefined ? data.isWhiteLabel : null
        ]
    )
}

export async function updateDomain(tenantId: string, domain: string | null) {
    await pool.query(
        `UPDATE tenants SET custom_domain = $1, dns_status = 'pending' WHERE id = $2`,
        [domain, tenantId]
    );
}

export async function verifyTenantDomain(tenantId: string) {
    const res = await pool.query('SELECT custom_domain FROM tenants WHERE id = $1', [tenantId]);
    const domain = res.rows[0]?.custom_domain;
    if (!domain) throw new Error('No custom domain set');

    const { dnsService } = await import('./dnsService');
    const verification = await dnsService.verifyDomain(domain);

    if (verification.success) {
        await pool.query("UPDATE tenants SET dns_status = 'verified' WHERE id = $1", [tenantId]);
        return { success: true };
    } else {
        await pool.query("UPDATE tenants SET dns_status = 'failed' WHERE id = $1", [tenantId]);
        return { success: false, error: verification.error };
    }
}

// ============================================================
// Segments (tenant_segments)
// ============================================================

export async function getSegments(tenantId: string) {
    const res = await pool.query(
        `SELECT id, name, description, what_included, price_range_min, price_range_max, typical_materials, sort_order
         FROM tenant_segments WHERE tenant_id = $1 ORDER BY sort_order`,
        [tenantId]
    )
    return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        whatIncluded: r.what_included,
        priceRangeMin: Number(r.price_range_min),
        priceRangeMax: Number(r.price_range_max),
        typicalMaterials: r.typical_materials,
        sortOrder: r.sort_order,
    }))
}

export async function updateSegment(
    tenantId: string,
    segmentId: number,
    data: {
        name?: string
        description?: string
        whatIncluded?: string
        priceRangeMin?: number
        priceRangeMax?: number
        typicalMaterials?: string
    }
) {
    const res = await pool.query(
        `UPDATE tenant_segments
         SET name = COALESCE($3, name),
             description = COALESCE($4, description),
             what_included = COALESCE($5, what_included),
             price_range_min = COALESCE($6, price_range_min),
             price_range_max = COALESCE($7, price_range_max),
             typical_materials = COALESCE($8, typical_materials)
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [
            segmentId,
            tenantId,
            data.name || null,
            data.description || null,
            data.whatIncluded || null,
            data.priceRangeMin ?? null,
            data.priceRangeMax ?? null,
            data.typicalMaterials || null,
        ]
    )
    return res.rows.length > 0
}

// ============================================================
// Bot Behavior (tenant_bot_behavior)
// ============================================================

export async function getBotBehavior(tenantId: string) {
    const res = await pool.query(
        `SELECT trigger_words, max_messages_without_cta, estimate_disclaimer, pdf_ttl_notice
         FROM tenant_bot_behavior WHERE tenant_id = $1`,
        [tenantId]
    )
    if (res.rows.length === 0) return null

    const row = res.rows[0]
    return {
        triggerWords: row.trigger_words || [],
        maxMessagesWithoutCta: row.max_messages_without_cta,
        estimateDisclaimer: row.estimate_disclaimer,
        pdfTtlNotice: row.pdf_ttl_notice,
    }
}

export async function updateBotBehavior(
    tenantId: string,
    data: {
        triggerWords?: string[]
        maxMessagesWithoutCta?: number
        estimateDisclaimer?: string
        pdfTtlNotice?: string
    }
) {
    await pool.query(
        `UPDATE tenant_bot_behavior
         SET trigger_words = COALESCE($2, trigger_words),
             max_messages_without_cta = COALESCE($3, max_messages_without_cta),
             estimate_disclaimer = COALESCE($4, estimate_disclaimer),
             pdf_ttl_notice = COALESCE($5, pdf_ttl_notice),
             updated_at = NOW()
         WHERE tenant_id = $1`,
        [
            tenantId,
            data.triggerWords ? JSON.stringify(data.triggerWords) : null,
            data.maxMessagesWithoutCta ?? null,
            data.estimateDisclaimer || null,
            data.pdfTtlNotice || null,
        ]
    )
}

// ============================================================
// Canned Responses (tenant_canned_responses)
// ============================================================

export async function getCannedResponses(tenantId: string) {
    const res = await pool.query(
        `SELECT id, title, content FROM tenant_canned_responses WHERE tenant_id = $1 ORDER BY created_at DESC`,
        [tenantId]
    )
    return res.rows
}

export async function addCannedResponse(tenantId: string, title: string, content: string) {
    const res = await pool.query(
        `INSERT INTO tenant_canned_responses (tenant_id, title, content)
         VALUES ($1, $2, $3)
         RETURNING id, title, content`,
        [tenantId, title, content]
    )
    return res.rows[0]
}

export async function deleteCannedResponse(tenantId: string, id: string) {
    const res = await pool.query(
        `DELETE FROM tenant_canned_responses WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [id, tenantId]
    )
    return res.rows.length > 0
}

// ============================================================
// Integrations (tenant_integrations)
// ============================================================

export async function getIntegrations(tenantId: string) {
    // Fetch current month usage for LLM
    const usageRes = await pool.query(
        `SELECT tokens_used, tokens_cost FROM tenant_usage 
         WHERE tenant_id = $1 AND month = date_trunc('month', NOW())`,
        [tenantId]
    )
    const usage = usageRes.rows[0] || { tokens_used: 0, tokens_cost: 0 }

    const res = await pool.query(
        `SELECT * FROM tenant_integrations WHERE tenant_id = $1`,
        [tenantId]
    )
    if (res.rows.length === 0) return null

    const r = res.rows[0]
    return {
        routerAI: {
            apiKey: r.routerai_api_key ? '••••' + '••••'.repeat(5) : '',
            primaryModel: r.routerai_primary_model,
            fallbackModel: r.routerai_fallback_model,
            dailyTokenLimit: r.routerai_daily_token_limit,
            currentMonthUsage: Number(usage.tokens_used),
            currentMonthCost: Number(usage.tokens_cost),
        },
        telegram: {
            botToken: r.telegram_bot_token ? '••••' + '••••'.repeat(5) : '',
            chatId: r.telegram_chat_id || '',
            notificationTemplate: r.telegram_notification_template || '',
        },
        yandexMetrika: {
            counterId: r.yandex_metrika_counter_id || '',
            events: r.yandex_metrika_events || {
                chat_opened: true,
                estimate_started: true,
                estimate_completed: true,
                lead_created: true,
            },
        },
        amoCRM: {
            webhookUrl: r.amocrm_webhook_url || '',
            apiKey: r.amocrm_api_key ? '••••' + '••••'.repeat(5) : '',
            fieldMapping: r.amocrm_field_mapping || [],
        },
    }
}

export async function updateIntegration(
    tenantId: string,
    service: string,
    data: Record<string, any>
) {
    const updates: string[] = []
    const params: any[] = [tenantId]
    let idx = 2

    if (service === 'routerAI' || service === 'routerai') {
        if (data.apiKey !== undefined && !data.apiKey.includes('••')) {
            updates.push(`routerai_api_key = $${idx}`)
            params.push(data.apiKey)
            idx++
        }
        if (data.primaryModel !== undefined) {
            updates.push(`routerai_primary_model = $${idx}`)
            params.push(data.primaryModel)
            idx++
        }
        if (data.fallbackModel !== undefined) {
            updates.push(`routerai_fallback_model = $${idx}`)
            params.push(data.fallbackModel)
            idx++
        }
        if (data.dailyTokenLimit !== undefined) {
            updates.push(`routerai_daily_token_limit = $${idx}`)
            params.push(data.dailyTokenLimit)
            idx++
        }
    } else if (service === 'telegram') {
        if (data.botToken !== undefined && !data.botToken.includes('••')) {
            updates.push(`telegram_bot_token = $${idx}`)
            params.push(data.botToken)
            idx++
        }
        if (data.chatId !== undefined) {
            updates.push(`telegram_chat_id = $${idx}`)
            params.push(data.chatId)
            idx++
        }
        if (data.notificationTemplate !== undefined) {
            updates.push(`telegram_notification_template = $${idx}`)
            params.push(data.notificationTemplate)
            idx++
        }
    } else if (service === 'yandexMetrika') {
        if (data.counterId !== undefined) {
            updates.push(`yandex_metrika_counter_id = $${idx}`)
            params.push(data.counterId)
            idx++
        }
        if (data.events !== undefined) {
            updates.push(`yandex_metrika_events = $${idx}`)
            params.push(JSON.stringify(data.events))
            idx++
        }
    } else if (service === 'amoCRM') {
        if (data.webhookUrl !== undefined) {
            updates.push(`amocrm_webhook_url = $${idx}`)
            params.push(data.webhookUrl)
            idx++
        }
        if (data.apiKey !== undefined && !data.apiKey.includes('••')) {
            updates.push(`amocrm_api_key = $${idx}`)
            params.push(data.apiKey)
            idx++
        }
        if (data.fieldMapping !== undefined) {
            updates.push(`amocrm_field_mapping = $${idx}`)
            params.push(JSON.stringify(data.fieldMapping))
            idx++
        }
    }

    if (updates.length === 0) return

    updates.push('updated_at = NOW()')
    await pool.query(
        `UPDATE tenant_integrations SET ${updates.join(', ')} WHERE tenant_id = $1`,
        params
    )
}

export async function testIntegration(tenantId: string, service: string) {
    // For MVP — just verify that credentials exist
    const res = await pool.query(
        'SELECT * FROM tenant_integrations WHERE tenant_id = $1',
        [tenantId]
    )
    if (res.rows.length === 0) {
        return { success: false, message: 'Настройки интеграций не найдены' }
    }

    const row = res.rows[0]

    if (service === 'telegram') {
        if (!row.telegram_bot_token || !row.telegram_chat_id) {
            return { success: false, message: 'Укажите токен бота и Chat ID' }
        }
        // Try sending a test message via Telegram bot API
        try {
            const resp = await fetch(
                `https://api.telegram.org/bot${row.telegram_bot_token}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: row.telegram_chat_id,
                        text: '✅ Тестовое сообщение от AI Max Platform',
                    }),
                }
            )
            const json = await resp.json() as { ok: boolean; description?: string }
            if (json.ok) {
                return { success: true, message: 'Сообщение успешно отправлено!' }
            }
            return { success: false, message: `Ошибка Telegram: ${json.description || 'unknown'}` }
        } catch (err: any) {
            return { success: false, message: `Ошибка подключения: ${err.message}` }
        }
    }

    if (service === 'routerAI' || service === 'routerai') {
        if (!row.routerai_api_key) {
            return { success: false, message: 'API-ключ RouterAI не указан' }
        }
        const url = process.env.ROUTERAI_BASE_URL || 'https://routerai.ru/api/v1'
        try {
            const resp = await fetch(`${url}/models`, {
                headers: {
                    'Authorization': `Bearer ${row.routerai_api_key}`
                }
            })
            if (resp.ok) {
                return { success: true, message: 'Подключение к RouterAI успешно установлено!' }
            }
            const errText = await resp.text()
            return { success: false, message: `Ошибка RouterAI (${resp.status}): ${errText.substring(0, 100)}` }
        } catch (err: any) {
            return { success: false, message: `Ошибка подключения: ${err.message}` }
        }
    }

    if (service === 'amoCRM') {
        if (!row.amocrm_webhook_url) {
            return { success: false, message: 'Укажите Webhook URL' }
        }
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (row.amocrm_api_key) {
                headers['Authorization'] = `Bearer ${row.amocrm_api_key}`
            }
            const resp = await fetch(row.amocrm_webhook_url, {
                method: 'POST',
                headers,
                body: JSON.stringify([{
                    name: 'Тестовая сделка от AI Max Platform',
                    price: 100000
                }])
            })
            if (resp.ok) {
                return { success: true, message: 'Тестовый webhook успешно отправлен!' }
            }
            const errText = await resp.text()
            return { success: false, message: `Ошибка webhook (${resp.status}): ${errText.substring(0, 100)}` }
        } catch (err: any) {
            return { success: false, message: `Ошибка сети: ${err.message}` }
        }
    }

    return { success: true, message: 'Подключение настроено' }
}

// ============================================================
// Dashboard Metrics
// ============================================================

export async function getDashboardMetrics(tenantId: string) {
    const [sessionsRes, leadsRes, messagesRes, funnelStartRes, funnelEndRes] = await Promise.all([
        pool.query(
            `SELECT COUNT(*)::int AS total FROM sessions WHERE tenant_id = $1`,
            [tenantId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS total FROM leads WHERE tenant_id = $1`,
            [tenantId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS total FROM messages m
             JOIN sessions s ON s.id = m.session_id
             WHERE s.tenant_id = $1`,
            [tenantId]
        ),
        // Started funnel: User answered first question (area)
        pool.query(
            `SELECT COUNT(DISTINCT s.id)::int AS total FROM sessions s
             JOIN messages m ON s.id = m.session_id
             WHERE s.tenant_id = $1 AND m.role = 'user' AND s.id IN (
                SELECT session_id FROM messages WHERE role = 'bot' AND content LIKE '%площадь%'
             )`,
            [tenantId]
        ),
        // Completed funnel: User was offered segment choice (bot message "подходит?")
        pool.query(
            `SELECT COUNT(DISTINCT s.id)::int AS total FROM sessions s
             JOIN messages m ON s.id = m.session_id
             WHERE s.tenant_id = $1 AND m.role = 'bot' AND (m.content LIKE '%подходит?%' OR m.content LIKE '%вариант%')`,
            [tenantId]
        ),
    ])

    const totalSessions = sessionsRes.rows[0].total
    const totalLeads = leadsRes.rows[0].total
    const totalMessages = messagesRes.rows[0].total
    const estimateStarted = funnelStartRes.rows[0].total
    const estimateCompleted = funnelEndRes.rows[0].total

    // Conversion rate
    const conversionRate = totalSessions > 0
        ? Math.round((totalLeads / totalSessions) * 100)
        : 0

    // Average messages per session (proxy for duration)
    const avgMessages = totalSessions > 0
        ? Math.round(totalMessages / totalSessions)
        : 0

    return {
        totalVisits: totalSessions,
        chatOpened: totalSessions,
        estimateStarted,
        estimateCompleted,
        leadsCreated: totalLeads,
        conversionRate,
        avgDialogDuration: avgMessages > 0
            ? `~${avgMessages} сообщений`
            : '—',
    }
}

export async function getFunnelDropOff(tenantId: string) {
    // This is a simplified version counting users who reached specific stages
    const steps = [
        { label: 'Всего сессий', query: 'SELECT COUNT(*)::int FROM sessions WHERE tenant_id = $1' },
        { label: 'Начали расчет', query: `SELECT COUNT(DISTINCT session_id)::int FROM messages m JOIN sessions s ON s.id = m.session_id WHERE s.tenant_id = $1 AND m.role = 'user' AND m.content ~ '^[0-9]+' AND s.id IN (SELECT session_id FROM messages WHERE content LIKE '%площадь%')` },
        { label: 'Заполнили параметры', query: `SELECT COUNT(DISTINCT session_id)::int FROM messages m JOIN sessions s ON s.id = m.session_id WHERE s.tenant_id = $1 AND m.role = 'bot' AND m.content LIKE '%будет стоить ориентировочно%'` },
        { label: 'Выбрали сегмент', query: `SELECT COUNT(DISTINCT session_id)::int FROM messages m JOIN sessions s ON s.id = m.session_id WHERE s.tenant_id = $1 AND m.role = 'user' AND s.id IN (SELECT session_id FROM messages WHERE content LIKE '%Какой вариант больше подходит?%')` },
        { label: 'Оставили контакт', query: `SELECT COUNT(*)::int FROM leads WHERE tenant_id = $1` },
    ]

    const result = []
    for (const step of steps) {
        const res = await pool.query(step.query, [tenantId])
        result.push({ name: step.label, value: res.rows[0].count || 0 })
    }
    return result
}

export async function getSegmentPopularity(tenantId: string) {
    const res = await pool.query(
        `SELECT apartment_params->>'selectedSegment' as segment, COUNT(*)::int as count 
         FROM leads 
         WHERE tenant_id = $1 AND apartment_params->>'selectedSegment' IS NOT NULL
         GROUP BY 1 
         ORDER BY 2 DESC`,
        [tenantId]
    )
    return res.rows.map(r => ({ name: r.segment, value: r.count }))
}

// ============================================================
// Dialog Rating
// ============================================================

export async function updateDialogRating(
    sessionId: string,
    tenantId: string,
    rating: string
) {
    const res = await pool.query(
        `UPDATE sessions SET manual_rating = $3
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [sessionId, tenantId, rating]
    )
    return res.rows.length > 0
}

// ============================================================
// Add Work Type (with price_matrix entries)
// ============================================================

export async function addWorkType(
    tenantId: string,
    data: {
        name: string
        unit: string
        category: string
        prices: { segment: string; priceMin: number; priceMax: number }[]
    }
) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const wtRes = await client.query(
            `INSERT INTO work_types (name, unit, category, tenant_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [data.name, data.unit, data.category, tenantId]
        )
        const workTypeId = wtRes.rows[0].id

        for (const p of data.prices) {
            await client.query(
                `INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [workTypeId, p.segment, p.priceMin, p.priceMax]
            )
        }

        await client.query('COMMIT')
        return { success: true, workTypeId }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

// ============================================================
// Branding (tenant_branding)
// ============================================================

export async function getBranding(tenantId: string) {
    const res = await pool.query(
        `SELECT * FROM tenant_branding WHERE tenant_id = $1`,
        [tenantId]
    )
    if (res.rows.length === 0) return null

    const r = res.rows[0]
    return {
        primaryColor: r.primary_color,
        secondaryColor: r.secondary_color,
        pageTitle: r.page_title,
        pageSubtitle: r.page_subtitle,
        heroImageUrl: r.hero_image_url,
        companyDescription: r.company_description,
        footerText: r.footer_text,
        faviconUrl: r.favicon_url,
        metaDescription: r.meta_description,
        contactPhone: r.contact_phone,
        officeAddress: r.office_address,
    }
}

export async function updateBranding(
    tenantId: string,
    data: {
        primaryColor?: string
        secondaryColor?: string
        pageTitle?: string
        pageSubtitle?: string
        heroImageUrl?: string
        companyDescription?: string
        footerText?: string
        faviconUrl?: string
        metaDescription?: string
        contactPhone?: string
        officeAddress?: string
    }
) {
    await pool.query(
        `UPDATE tenant_branding
         SET primary_color = COALESCE($2, primary_color),
             secondary_color = COALESCE($3, secondary_color),
             page_title = COALESCE($4, page_title),
             page_subtitle = COALESCE($5, page_subtitle),
             hero_image_url = COALESCE($6, hero_image_url),
             company_description = COALESCE($7, company_description),
             footer_text = COALESCE($8, footer_text),
             favicon_url = COALESCE($9, favicon_url),
             meta_description = COALESCE($10, meta_description),
             contact_phone = COALESCE($11, contact_phone),
             office_address = COALESCE($12, office_address),
             updated_at = NOW()
         WHERE tenant_id = $1`,
        [
            tenantId,
            data.primaryColor || null,
            data.secondaryColor || null,
            data.pageTitle || null,
            data.pageSubtitle || null,
            data.heroImageUrl || null,
            data.companyDescription || null,
            data.footerText || null,
            data.faviconUrl || null,
            data.metaDescription || null,
            data.contactPhone || null,
            data.officeAddress || null,
        ]
    )
}

// ============================================================
// Team (tenant_users)
// ============================================================

export async function getTeamMembers(tenantId: string) {
    const res = await pool.query(
        `SELECT id, email, name, role, is_active, created_at, last_login_at
         FROM tenant_users WHERE tenant_id = $1
         ORDER BY created_at ASC`,
        [tenantId]
    )
    return res.rows
}

export async function addTeamMember(
    tenantId: string,
    data: { email: string; password: string; name: string; role: string }
) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
    const res = await pool.query(
        `INSERT INTO tenant_users (tenant_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, is_active, created_at`,
        [tenantId, data.email.toLowerCase(), passwordHash, data.name, data.role]
    )
    return res.rows[0]
}

export async function updateTeamMember(
    tenantId: string,
    userId: string,
    data: { role?: string; isActive?: boolean; name?: string }
) {
    const updates: string[] = []
    const params: any[] = [userId, tenantId]
    let idx = 3

    if (data.role !== undefined) {
        updates.push(`role = $${idx}`)
        params.push(data.role)
        idx++
    }
    if (data.isActive !== undefined) {
        updates.push(`is_active = $${idx}`)
        params.push(data.isActive)
        idx++
    }
    if (data.name !== undefined) {
        updates.push(`name = $${idx}`)
        params.push(data.name)
        idx++
    }

    if (updates.length === 0) return false

    const res = await pool.query(
        `UPDATE tenant_users SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        params
    )
    return res.rows.length > 0
}

export async function removeTeamMember(tenantId: string, userId: string) {
    const res = await pool.query(
        `DELETE FROM tenant_users WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [userId, tenantId]
    )
    return res.rows.length > 0
}

// ============================================================
// Billing
// ============================================================

// (PLAN_LIMITS is imported from ../config/limits)


export async function getBilling(tenantId: string) {
    const [tenantRes, usageRes] = await Promise.all([
        pool.query(
            `SELECT plan, trial_ends_at, created_at FROM tenants WHERE id = $1`,
            [tenantId]
        ),
        pool.query(
            `SELECT sessions_count, messages_count, leads_count, tokens_used, pdf_generated, storage_bytes
             FROM tenant_usage
             WHERE tenant_id = $1 AND month = date_trunc('month', NOW())`,
            [tenantId]
        ),
    ])

    const tenant = tenantRes.rows[0]
    const usage = usageRes.rows[0] || {
        sessions_count: 0,
        messages_count: 0,
        leads_count: 0,
        tokens_used: 0,
        pdf_generated: 0,
        storage_bytes: 0,
    }
    const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS.free

    // Count team members
    const teamRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM tenant_users WHERE tenant_id = $1`,
        [tenantId]
    )
    const teamCount = teamRes.rows[0].count

    return {
        plan: tenant.plan,
        trialEndsAt: tenant.trial_ends_at,
        createdAt: tenant.created_at,
        usage: {
            sessions: { used: usage.sessions_count, limit: limits.sessions },
            messages: { used: usage.messages_count, limit: limits.messages },
            leads: { used: usage.leads_count, limit: limits.leads },
            tokens: { used: Number(usage.tokens_used), limit: limits.tokens },
            team: { used: teamCount + 1, limit: limits.team }, // +1 for owner
        },
    } as any // Cast for simplicity or define full interface
}
