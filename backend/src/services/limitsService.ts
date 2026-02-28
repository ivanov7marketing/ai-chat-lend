import { pool } from '../db/client'
import { PLAN_LIMITS } from '../config/limits'

export async function checkLimit(tenantId: string, resourceType: 'sessions' | 'messages' | 'leads' | 'tokens' | 'team'): Promise<{ allowed: boolean; reason?: string }> {
    if (!tenantId) return { allowed: true } // allow for anonymous if any

    const tenantRes = await pool.query(
        `SELECT plan, trial_ends_at FROM tenants WHERE id = $1`,
        [tenantId]
    )

    if (tenantRes.rows.length === 0) {
        return { allowed: false, reason: 'Tenant not found' }
    }

    const tenant = tenantRes.rows[0]

    // Trial check: strictly block if trial expired AND plan is still 'free' (or any other logic)
    if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) {
        if (tenant.plan === 'free') {
            return { allowed: false, reason: 'Пробный период истёк. Пожалуйста, выберите тарифный план.' }
        }
    }

    const plan: keyof typeof PLAN_LIMITS = (tenant.plan as keyof typeof PLAN_LIMITS) || 'free'
    const limits = PLAN_LIMITS[plan]

    if (!limits) {
        return { allowed: false, reason: 'Invalid plan' }
    }

    // Trial check logic (simplistic: if trial ended and plan is free, maybe restrict? 
    // Here we'll just strictly enforce plan limits regardless of trial for MVP)

    if (resourceType === 'team') {
        const teamRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM tenant_users WHERE tenant_id = $1`,
            [tenantId]
        )
        const teamCount = teamRes.rows[0].count
        if (teamCount + 1 >= limits.team) { // +1 for owner
            return { allowed: false, reason: `Достигнут лимит команды для тарифа ${plan}` }
        }
        return { allowed: true }
    }

    // For usage-based resources
    const usageRes = await pool.query(
        `SELECT sessions_count, messages_count, leads_count, tokens_used
         FROM tenant_usage
         WHERE tenant_id = $1 AND month = date_trunc('month', NOW())`,
        [tenantId]
    )

    const usage = usageRes.rows[0] || {
        sessions_count: 0,
        messages_count: 0,
        leads_count: 0,
        tokens_used: 0
    }

    let currentUsage = 0
    switch (resourceType) {
        case 'sessions': currentUsage = usage.sessions_count; break;
        case 'messages': currentUsage = usage.messages_count; break;
        case 'leads': currentUsage = usage.leads_count; break;
        case 'tokens': currentUsage = Number(usage.tokens_used); break;
    }

    // 1. Check Monthly Plan Limit
    if (currentUsage >= limits[resourceType]) {
        return { allowed: false, reason: `Исчерпан лимит ${resourceType} для тарифа ${plan} (${limits[resourceType]})` }
    }

    // 2. Custom Daily Token Limit Check (only for tokens)
    if (resourceType === 'tokens') {
        const integrationRes = await pool.query(
            `SELECT routerai_daily_token_limit FROM tenant_integrations WHERE tenant_id = $1`,
            [tenantId]
        )
        const dailyLimit = integrationRes.rows[0]?.routerai_daily_token_limit

        if (dailyLimit && dailyLimit > 0) {
            const dailyUsageRes = await pool.query(
                `SELECT tokens_used FROM tenant_usage_daily 
                 WHERE tenant_id = $1 AND day = CURRENT_DATE`,
                [tenantId]
            )
            const tokensUsedToday = Number(dailyUsageRes.rows[0]?.tokens_used || 0)

            if (tokensUsedToday >= dailyLimit) {
                return {
                    allowed: false,
                    reason: `Превышен ваш дневной лимит токенов (${dailyLimit}). Пожалуйста, увеличьте лимит в настройках или подождите начала нового дня.`
                }
            }
        }
    }

    return { allowed: true }
}
