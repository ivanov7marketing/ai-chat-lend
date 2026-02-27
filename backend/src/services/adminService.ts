import { pool } from '../db/client'

/**
 * Все запросы adminService теперь принимают tenantId для data isolation.
 * tenantId = null — обратная совместимость (single-tenant, superadmin access all).
 */

export async function getDialogsList(
    limit: number,
    offset: number,
    tenantId?: string | null
) {
    const where = tenantId ? 'WHERE s.tenant_id = $3' : ''
    const params: any[] = tenantId ? [limit, offset, tenantId] : [limit, offset]

    const countWhere = tenantId ? 'WHERE tenant_id = $1' : ''
    const countParams: any[] = tenantId ? [tenantId] : []

    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM sessions ${countWhere}`, countParams
    )
    const total = countRes.rows[0].total

    const res = await pool.query(
        `SELECT
            s.id, s.created_at, s.status, s.utm_source, s.device, s.tenant_id, s.is_human_managed,
            l.contact_type, l.contact_value AS phone,
            l.estimate_min, l.estimate_max, l.selected_segment,
            (l.apartment_params->>'area') AS area,
            (l.apartment_params->>'repairType') AS repair_type
         FROM sessions s
         LEFT JOIN leads l ON l.session_id = s.id
         ${where}
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
    )

    return { data: res.rows, total }
}

export async function getDialogDetail(sessionId: string, tenantId?: string | null) {
    // Получить сессию
    const sessionWhere = tenantId
        ? 'WHERE id = $1 AND tenant_id = $2'
        : 'WHERE id = $1'
    const sessionParams: any[] = tenantId ? [sessionId, tenantId] : [sessionId]

    const sessionRes = await pool.query(
        `SELECT * FROM sessions ${sessionWhere}`, sessionParams
    )
    if (sessionRes.rows.length === 0) return null

    const session = sessionRes.rows[0]

    // lead
    const leadRes = await pool.query(
        `SELECT * FROM leads WHERE session_id = $1`, [sessionId]
    )
    const lead = leadRes.rows[0] || null

    // messages
    const messagesRes = await pool.query(
        `SELECT id, role, content, created_at FROM messages
         WHERE session_id = $1 ORDER BY created_at ASC`,
        [sessionId]
    )

    return {
        session,
        lead,
        messages: messagesRes.rows,
    }
}

export async function getPrices(tenantId?: string | null) {
    const where = tenantId
        ? 'WHERE wt.tenant_id = $1'
        : ''
    const params: any[] = tenantId ? [tenantId] : []

    const res = await pool.query(
        `SELECT wt.id AS work_type_id, wt.name, wt.unit, wt.category,
                pm.segment, pm.price_min, pm.price_max
         FROM work_types wt
         LEFT JOIN price_matrix pm ON pm.work_type_id = wt.id
         ${where}
         ORDER BY wt.category, wt.name, pm.segment`,
        params
    )
    return res.rows
}

export async function updatePrices(
    updates: { workTypeId: number; segment: string; priceMin: number; priceMax: number }[],
    tenantId?: string | null
) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        for (const u of updates) {
            // Проверить что work_type принадлежит тенанту (если tenantId указан)
            if (tenantId) {
                const check = await client.query(
                    'SELECT id FROM work_types WHERE id = $1 AND tenant_id = $2',
                    [u.workTypeId, tenantId]
                )
                if (check.rows.length === 0) continue // skip foreign work types
            }

            await client.query(
                `INSERT INTO price_matrix (work_type_id, segment, price_min, price_max, updated_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (work_type_id, segment)
                 DO UPDATE SET price_min = $3, price_max = $4, updated_at = NOW()`,
                [u.workTypeId, u.segment, u.priceMin, u.priceMax]
            )
        }
        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

export async function getLeadsExport(tenantId: string) {
    const res = await pool.query(
        `SELECT 
            l.created_at,
            l.contact_type,
            l.contact_value,
            l.estimate_min,
            l.estimate_max,
            l.selected_segment,
            l.apartment_params->>'area' as area,
            l.apartment_params->>'repairType' as repair_type,
            s.utm_source,
            s.utm_medium,
            s.utm_campaign
         FROM leads l
         JOIN sessions s ON s.id = l.session_id
         WHERE l.tenant_id = $1
         ORDER BY l.created_at DESC`,
        [tenantId]
    )
    return res.rows
}
