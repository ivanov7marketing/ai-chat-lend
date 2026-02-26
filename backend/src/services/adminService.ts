import { pool } from '../db/client'

export async function getDialogsList(limit: number = 50, offset: number = 0) {
    const res = await pool.query(
        `SELECT 
            s.id, 
            s.created_at, 
            s.status, 
            s.utm_source,
            l.contact_type,
            l.contact_value as phone,
            l.estimate_max
         FROM sessions s
         LEFT JOIN leads l ON s.id = l.session_id
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    )

    const countRes = await pool.query(`SELECT COUNT(*) FROM sessions`)
    const totalCount = parseInt(countRes.rows[0].count, 10)

    return {
        data: res.rows,
        total: totalCount,
        limit,
        offset
    }
}

export async function getDialogDetail(sessionId: string) {
    const sessionRes = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [sessionId])
    if (sessionRes.rows.length === 0) return null

    const leadRes = await pool.query(`SELECT * FROM leads WHERE session_id = $1`, [sessionId])
    const messagesRes = await pool.query(`SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC`, [sessionId])

    return {
        session: sessionRes.rows[0],
        lead: leadRes.rows.length > 0 ? leadRes.rows[0] : null,
        messages: messagesRes.rows
    }
}

export async function updatePrices() {
    // Placeholder implementation for v1.2 prices update
    return { success: true }
}
