import { pool } from '../db/client'

export async function createSession(utmSource?: string, device?: string) {
    const res = await pool.query(
        `INSERT INTO sessions (utm_source, device) VALUES ($1, $2) RETURNING id`,
        [utmSource || null, device || null]
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
