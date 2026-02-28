import { pool } from '../db/client'

export async function incrementTenantUsage(
    tenantId: string,
    metric: 'sessions_count' | 'messages_count' | 'leads_count' | 'tokens_used' | 'tokens_cost',
    value: number = 1
) {
    if (!tenantId) return

    // Month truncated to start of month
    await pool.query(
        `INSERT INTO tenant_usage (tenant_id, month, ${metric})
         VALUES ($1, date_trunc('month', NOW()), $2)
         ON CONFLICT (tenant_id, month)
         DO UPDATE SET ${metric} = tenant_usage.${metric} + $2`,
        [tenantId, value]
    )

    // Daily tracking for tokens
    if (metric === 'tokens_used') {
        await pool.query(
            `INSERT INTO tenant_usage_daily (tenant_id, day, tokens_used)
             VALUES ($1, CURRENT_DATE, $2)
             ON CONFLICT (tenant_id, day)
             DO UPDATE SET tokens_used = tenant_usage_daily.tokens_used + $2`,
            [tenantId, value]
        )
    }
}

export async function createSession(utmSource?: string, device?: string, tenantId?: string) {
    const res = await pool.query(
        `INSERT INTO sessions (utm_source, device, tenant_id) VALUES ($1, $2, $3) RETURNING id`,
        [utmSource || null, device || null, tenantId || null]
    )
    const sessionId = res.rows[0].id as string

    // Increment sessions_count
    if (tenantId) {
        await incrementTenantUsage(tenantId, 'sessions_count')
    }

    return sessionId
}

export async function saveMessage(
    sessionId: string,
    role: 'user' | 'bot' | 'manager',
    content: string
) {
    await pool.query(
        `INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)`,
        [sessionId, role, content]
    )

    // Increment messages_count
    const sessionRes = await pool.query(
        `SELECT tenant_id FROM sessions WHERE id = $1`,
        [sessionId]
    )
    if (sessionRes.rows.length > 0 && sessionRes.rows[0].tenant_id) {
        await incrementTenantUsage(sessionRes.rows[0].tenant_id, 'messages_count')
    }
}

export async function updateSessionStatus(sessionId: string, status: string) {
    await pool.query(
        `UPDATE sessions SET status = $1 WHERE id = $2`,
        [status, sessionId]
    )
}

export async function setHumanManaged(sessionId: string, isHumanManaged: boolean = true) {
    await pool.query(
        `UPDATE sessions SET is_human_managed = $1 WHERE id = $2`,
        [isHumanManaged, sessionId]
    )
}
