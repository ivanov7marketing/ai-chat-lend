import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pool } from '../db/client'
import { authGuard, getAuth } from '../middleware/authGuard'
import * as invoiceService from '../services/invoiceService'

/**
 * Маршруты суперадминки (владелец платформы)
 * Все маршруты защищены authGuard(['superadmin'])
 */
export async function superAdminRoutes(fastify: FastifyInstance) {

    const guard = authGuard(['superadmin'])

    // ============ Дашборд платформы ============
    fastify.get('/api/superadmin/dashboard', {
        preHandler: [guard],
    }, async (_req: FastifyRequest, reply: FastifyReply) => {
        const [tenants, sessions, leads, usage] = await Promise.all([
            pool.query(`SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_active) ::int AS active,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS new_30d
              FROM tenants`),
            pool.query(`SELECT COUNT(*)::int AS total FROM sessions`),
            pool.query(`SELECT COUNT(*)::int AS total FROM leads`),
            pool.query(`SELECT
                COALESCE(SUM(tokens_used), 0)::bigint AS total_tokens,
                COALESCE(SUM(sessions_count), 0)::int AS total_sessions
              FROM tenant_usage WHERE month = date_trunc('month', NOW())`),
        ])

        const t = tenants.rows[0]
        const s = sessions.rows[0]
        const l = leads.rows[0]

        // MRR calculation (paid invoices this month)
        const mrrRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0)::numeric AS mrr
             FROM invoices
             WHERE status = 'paid' AND created_at >= date_trunc('month', NOW())`
        )

        // Распределение по тарифам
        const planDist = await pool.query(
            `SELECT plan, COUNT(*)::int AS count FROM tenants GROUP BY plan ORDER BY plan`
        )

        return reply.send({
            totalTenants: t.total,
            activeTenants: t.active,
            newTenants: t.new_30d,
            totalSessions: s.total,
            totalLeads: l.total,
            mrr: Number(mrrRes.rows[0].mrr),
            planDistribution: planDist.rows,
        })
    })

    // ============ Список тенантов ============
    fastify.get('/api/superadmin/tenants', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const query = req.query as { limit?: string; offset?: string; search?: string; plan?: string; status?: string }
        const limit = Math.min(Number(query.limit) || 20, 100)
        const offset = Number(query.offset) || 0
        const search = query.search?.toLowerCase()
        const plan = query.plan
        const status = query.status

        let where = 'WHERE 1=1'
        const params: any[] = []
        let paramIndex = 1

        if (search) {
            where += ` AND (LOWER(company_name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(slug) LIKE $${paramIndex})`
            params.push(`%${search}%`)
            paramIndex++
        }
        if (plan && plan !== 'all') {
            where += ` AND plan = $${paramIndex}`
            params.push(plan)
            paramIndex++
        }
        if (status === 'active') {
            where += ` AND is_active = TRUE`
        } else if (status === 'blocked') {
            where += ` AND is_active = FALSE`
        }

        const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM tenants ${where}`, params)
        const total = countRes.rows[0].total

        const tenantsRes = await pool.query(
            `SELECT t.id, t.slug, t.company_name, t.email, t.phone, t.city,
                    t.plan, t.is_active, t.is_verified, t.created_at, t.last_login_at,
                    COALESCE(u.sessions_count, 0)::int AS sessions_month,
                    COALESCE(u.leads_count, 0)::int AS leads_month
             FROM tenants t
             LEFT JOIN tenant_usage u ON u.tenant_id = t.id AND u.month = date_trunc('month', NOW())
             ${where}
             ORDER BY t.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        )

        return reply.send({ data: tenantsRes.rows, total })
    })

    // ============ Детали тенанта ============
    fastify.get('/api/superadmin/tenants/:id', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }

        const [tenantRes, botRes, brandingRes, usageRes, recentSessions] = await Promise.all([
            pool.query(`SELECT * FROM tenants WHERE id = $1`, [id]),
            pool.query(`SELECT * FROM tenant_bot_settings WHERE tenant_id = $1`, [id]),
            pool.query(`SELECT * FROM tenant_branding WHERE tenant_id = $1`, [id]),
            pool.query(
                `SELECT * FROM tenant_usage WHERE tenant_id = $1 ORDER BY month DESC LIMIT 6`,
                [id]
            ),
            pool.query(
                `SELECT id, created_at, status, utm_source FROM sessions
                 WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`,
                [id]
            ),
        ])

        if (tenantRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Tenant not found' })
        }

        const usageRows = usageRes.rows
        const currentUsage = usageRows.find(u =>
            new Date(u.month).getMonth() === new Date().getMonth() &&
            new Date(u.month).getFullYear() === new Date().getFullYear()
        ) || {
            sessions_count: 0,
            messages_count: 0,
            leads_count: 0,
            tokens_used: 0,
            pdf_generated: 0,
            storage_bytes: 0
        }

        return reply.send({
            tenant: {
                ...tenantRes.rows[0],
                companyName: tenantRes.rows[0].company_name, // Mapping for frontend
            },
            botSettings: botRes.rows[0] || null,
            branding: brandingRes.rows[0] || null,
            usage: {
                sessionsCount: currentUsage.sessions_count,
                messagesCount: currentUsage.messages_count,
                leadsCount: currentUsage.leads_count,
                tokensUsed: currentUsage.tokens_used,
                pdfGenerated: currentUsage.pdf_generated,
                storageBytes: currentUsage.storage_bytes,
            },
            usageHistory: usageRes.rows,
            recentSessions: recentSessions.rows,
        })
    })

    // ============ Изменить тенанта (план, статус) ============
    fastify.put('/api/superadmin/tenants/:id', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        const body = req.body as { plan?: string; is_active?: boolean }

        const updates: string[] = []
        const params: any[] = []
        let idx = 1

        if (body.plan !== undefined) {
            updates.push(`plan = $${idx}`)
            params.push(body.plan)
            idx++
        }
        if (body.is_active !== undefined) {
            updates.push(`is_active = $${idx}`)
            params.push(body.is_active)
            idx++
        }

        if (updates.length === 0) {
            return reply.status(400).send({ error: 'Нет полей для обновления' })
        }

        params.push(id)
        await pool.query(
            `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`,
            params
        )

        // Аудит-лог
        const auth = getAuth(req)
        await pool.query(
            `INSERT INTO platform_audit_log (actor_type, actor_id, tenant_id, action, details, ip_address)
             VALUES ('superadmin', $1, $2, 'tenant.updated', $3, $4)`,
            [auth.userId, id, JSON.stringify(body), req.ip]
        )

        return reply.send({ success: true })
    })

    // ============ Заблокировать/разблокировать ============
    fastify.post('/api/superadmin/tenants/:id/block', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        await pool.query('UPDATE tenants SET is_active = FALSE WHERE id = $1', [id])

        const auth = getAuth(req)
        await pool.query(
            `INSERT INTO platform_audit_log (actor_type, actor_id, tenant_id, action, ip_address)
             VALUES ('superadmin', $1, $2, 'tenant.blocked', $3)`,
            [auth.userId, id, req.ip]
        )

        return reply.send({ success: true })
    })

    fastify.post('/api/superadmin/tenants/:id/unblock', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        await pool.query('UPDATE tenants SET is_active = TRUE WHERE id = $1', [id])

        const auth = getAuth(req)
        await pool.query(
            `INSERT INTO platform_audit_log (actor_type, actor_id, tenant_id, action, ip_address)
             VALUES ('superadmin', $1, $2, 'tenant.unblocked', $3)`,
            [auth.userId, id, req.ip]
        )

        return reply.send({ success: true })
    })

    // ============ Аудит-лог ============
    fastify.get('/api/superadmin/audit', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const query = req.query as { limit?: string; offset?: string; tenantId?: string }
        const limit = Math.min(Number(query.limit) || 50, 200)
        const offset = Number(query.offset) || 0

        let where = ''
        const params: any[] = [limit, offset]

        if (query.tenantId) {
            where = 'WHERE tenant_id = $3'
            params.push(query.tenantId)
        }

        const res = await pool.query(
            `SELECT al.*, t.company_name AS tenant_name
             FROM platform_audit_log al
             LEFT JOIN tenants t ON t.id = al.tenant_id
             ${where}
             ORDER BY al.created_at DESC
             LIMIT $1 OFFSET $2`,
            params
        )

        return reply.send({ data: res.rows })
    })

    // ============ Счета (Invoices) ============
    fastify.get('/api/superadmin/invoices', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const invoices = await invoiceService.getAllInvoices()
        return reply.send({ data: invoices })
    })

    fastify.put('/api/superadmin/invoices/:id/pay', {
        preHandler: [guard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        const auth = getAuth(req)

        try {
            await invoiceService.markInvoicePaid(id, auth.userId)
            return reply.send({ success: true })
        } catch (error: any) {
            return reply.status(400).send({ error: error.message })
        }
    })
}
