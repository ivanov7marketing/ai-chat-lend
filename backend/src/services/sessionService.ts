import { pool } from '../db/client'

export async function createSession(utmSource?: string, device?: string, tenantId?: string) {
    const res = await pool.query(
        `INSERT INTO sessions (utm_source, device, tenant_id) VALUES ($1, $2, $3) RETURNING id`,
        [utmSource || null, device || null, tenantId || null]
    )
    return res.rows[0].id as string
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
}

export async function updateSessionStatus(sessionId: string, status: string) {
    await pool.query(
        `UPDATE sessions SET status = $1 WHERE id = $2`,
        [status, sessionId]
    )
}
