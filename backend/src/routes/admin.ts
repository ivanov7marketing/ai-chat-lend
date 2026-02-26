import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getDialogsList, getDialogDetail, getPrices, updatePrices } from '../services/adminService'
import { tenantResolver, getTenantId } from '../middleware/tenantResolver'
import { authGuard } from '../middleware/authGuard'

/**
 * Admin-маршруты тенанта (защищены authGuard)
 * Префикс: /api/t/:slug/admin/*
 *
 * Также сохраняется обратная совместимость для старых маршрутов /api/admin/*
 * (без авторизации — для mvp/dev)
 */
export async function adminRoutes(fastify: FastifyInstance) {

    const tenantGuard = authGuard(['tenant_owner', 'tenant_user'])

    // ============================================================
    // Обратная совместимость: старые маршруты /api/admin/* (без auth, без tenant isolation)
    // TODO: удалить после полного перехода на multi-tenant
    // ============================================================
    fastify.get('/api/admin/dialogs', async (req: FastifyRequest, reply: FastifyReply) => {
        const query = req.query as Record<string, string>
        const limit = Math.min(Number(query.limit) || 20, 1000)
        const offset = Number(query.offset) || 0
        const result = await getDialogsList(limit, offset, null)
        return reply.send(result)
    })

    fastify.get('/api/admin/dialog/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        const result = await getDialogDetail(id, null)
        if (!result) return reply.status(404).send({ error: 'Dialog not found' })
        return reply.send(result)
    })

    fastify.get('/api/admin/prices', async (_req: FastifyRequest, reply: FastifyReply) => {
        const prices = await getPrices(null)
        return reply.send(prices)
    })

    fastify.put('/api/admin/prices', async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as { workTypeId: number; segment: string; priceMin: number; priceMax: number }[]
        await updatePrices(body, null)
        return reply.send({ success: true })
    })

    // ============================================================
    // Multi-tenant маршруты: /api/t/:slug/admin/*
    // ============================================================

    // Dialogs
    fastify.get('/api/t/:slug/admin/dialogs', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const query = req.query as Record<string, string>
        const limit = Math.min(Number(query.limit) || 20, 1000)
        const offset = Number(query.offset) || 0
        const result = await getDialogsList(limit, offset, tenantId)
        return reply.send(result)
    })

    fastify.get('/api/t/:slug/admin/dialogs/:id', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { id } = req.params as { id: string; slug: string }
        const result = await getDialogDetail(id, tenantId)
        if (!result) return reply.status(404).send({ error: 'Dialog not found' })
        return reply.send(result)
    })

    // Prices
    fastify.get('/api/t/:slug/admin/prices', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const prices = await getPrices(tenantId)
        return reply.send(prices)
    })

    fastify.put('/api/t/:slug/admin/prices', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as { workTypeId: number; segment: string; priceMin: number; priceMax: number }[]
        await updatePrices(body, tenantId)
        return reply.send({ success: true })
    })
}
