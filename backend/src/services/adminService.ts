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

export async function getPricesList() {
    const res = await pool.query(`
        SELECT 
            w.id as work_type_id,
            w.name,
            w.unit,
            w.category,
            p.segment,
            p.price_min,
            p.price_max
        FROM work_types w
        LEFT JOIN price_matrix p ON w.id = p.work_type_id
        ORDER BY w.category ASC, w.id ASC
    `)
    return res.rows
}

export async function updatePrices(updates: { workTypeId: number, segment: string, priceMin: number, priceMax: number }[]) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        for (const u of updates) {
            await client.query(`
                INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (work_type_id, segment) 
                DO UPDATE SET price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max, updated_at = NOW()
            `, [u.workTypeId, u.segment, u.priceMin, u.priceMax])
        }
        await client.query('COMMIT')
        return { success: true }
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}
