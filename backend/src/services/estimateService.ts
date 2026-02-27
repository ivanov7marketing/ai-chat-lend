import { pool } from '../db/client'

export async function createEstimate(
    sessionId: string | null,
    tenantId: string | null,
    params: any,
    resultJson: any,
    pdfUrl: string | null
) {
    const res = await pool.query(
        `INSERT INTO estimates (session_id, tenant_id, params, result_json, pdf_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [sessionId, tenantId, JSON.stringify(params), JSON.stringify(resultJson), pdfUrl]
    )
    return res.rows[0]
}

export async function getEstimateById(id: string) {
    const res = await pool.query(`SELECT * FROM estimates WHERE id = $1`, [id])
    return res.rows[0] || null
}
