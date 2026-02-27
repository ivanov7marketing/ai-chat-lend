import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getDialogsList, getDialogDetail, getPrices, updatePrices } from '../services/adminService'
import {
    getBotPersonality, updateBotPersonality,
    getSegments, updateSegment,
    getBotBehavior, updateBotBehavior,
    getIntegrations, updateIntegration, testIntegration,
    getDashboardMetrics, updateDialogRating, addWorkType,
    getBranding, updateBranding,
    getTeamMembers, addTeamMember, updateTeamMember, removeTeamMember,
    getBilling,
} from '../services/tenantAdminService'
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

    // ---------- Dashboard Metrics ----------
    fastify.get('/api/t/:slug/admin/dashboard/metrics', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const metrics = await getDashboardMetrics(tenantId)
        return reply.send(metrics)
    })

    // ---------- Dialogs ----------
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

    fastify.put('/api/t/:slug/admin/dialogs/:id/rating', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { id } = req.params as { id: string; slug: string }
        const { rating } = req.body as { rating: string }
        const updated = await updateDialogRating(id, tenantId, rating)
        if (!updated) return reply.status(404).send({ error: 'Dialog not found' })
        return reply.send({ success: true })
    })

    // ---------- Prices ----------
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

    fastify.post('/api/t/:slug/admin/prices', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as {
            name: string; unit: string; category: string
            prices: { segment: string; priceMin: number; priceMax: number }[]
        }
        const result = await addWorkType(tenantId, body)
        return reply.send(result)
    })

    // ---------- Bot Personality ----------
    fastify.get('/api/t/:slug/admin/bot/personality', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const personality = await getBotPersonality(tenantId)
        if (!personality) return reply.status(404).send({ error: 'Bot settings not found' })
        return reply.send(personality)
    })

    fastify.put('/api/t/:slug/admin/bot/personality', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as {
            name?: string; tone?: string; language?: string
            welcomeMessage?: string; quickButtons?: any[]
        }
        await updateBotPersonality(tenantId, body)
        return reply.send({ success: true })
    })

    // ---------- Bot Segments ----------
    fastify.get('/api/t/:slug/admin/bot/segments', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const segments = await getSegments(tenantId)
        return reply.send(segments)
    })

    fastify.put('/api/t/:slug/admin/bot/segments/:segmentId', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { segmentId } = req.params as { segmentId: string; slug: string }
        const body = req.body as {
            name?: string; description?: string; whatIncluded?: string
            priceRangeMin?: number; priceRangeMax?: number; typicalMaterials?: string
        }
        const updated = await updateSegment(tenantId, Number(segmentId), body)
        if (!updated) return reply.status(404).send({ error: 'Segment not found' })
        return reply.send({ success: true })
    })

    // ---------- Bot Behavior ----------
    fastify.get('/api/t/:slug/admin/bot/behavior', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const behavior = await getBotBehavior(tenantId)
        if (!behavior) return reply.status(404).send({ error: 'Bot behavior not found' })
        return reply.send(behavior)
    })

    fastify.put('/api/t/:slug/admin/bot/behavior', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as {
            triggerWords?: string[]; maxMessagesWithoutCta?: number
            estimateDisclaimer?: string; pdfTtlNotice?: string
        }
        await updateBotBehavior(tenantId, body)
        return reply.send({ success: true })
    })

    // ---------- Integrations ----------
    fastify.get('/api/t/:slug/admin/integrations', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const integrations = await getIntegrations(tenantId)
        if (!integrations) return reply.status(404).send({ error: 'Integrations not found' })
        return reply.send(integrations)
    })

    fastify.put('/api/t/:slug/admin/integrations/:service', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { service } = req.params as { service: string; slug: string }
        const body = req.body as Record<string, any>
        await updateIntegration(tenantId, service, body)
        return reply.send({ success: true })
    })

    fastify.post('/api/t/:slug/admin/integrations/:service/test', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { service } = req.params as { service: string; slug: string }
        const result = await testIntegration(tenantId, service)
        return reply.send(result)
    })

    // ---------- Branding ----------
    fastify.get('/api/t/:slug/admin/branding', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const branding = await getBranding(tenantId)
        if (!branding) return reply.status(404).send({ error: 'Branding not found' })
        return reply.send(branding)
    })

    fastify.put('/api/t/:slug/admin/branding', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as Record<string, any>
        await updateBranding(tenantId, body)
        return reply.send({ success: true })
    })

    // ---------- Team ----------
    fastify.get('/api/t/:slug/admin/team', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const members = await getTeamMembers(tenantId)
        return reply.send(members)
    })

    fastify.post('/api/t/:slug/admin/team', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const body = req.body as { email: string; password: string; name: string; role: string }
        try {
            const member = await addTeamMember(tenantId, body)
            return reply.status(201).send(member)
        } catch (err: any) {
            if (err.code === '23505') {
                return reply.status(409).send({ error: 'Пользователь с таким email уже существует' })
            }
            throw err
        }
    })

    fastify.put('/api/t/:slug/admin/team/:userId', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { userId } = req.params as { userId: string; slug: string }
        const body = req.body as { role?: string; isActive?: boolean; name?: string }
        const updated = await updateTeamMember(tenantId, userId, body)
        if (!updated) return reply.status(404).send({ error: 'User not found' })
        return reply.send({ success: true })
    })

    fastify.delete('/api/t/:slug/admin/team/:userId', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const { userId } = req.params as { userId: string; slug: string }
        const deleted = await removeTeamMember(tenantId, userId)
        if (!deleted) return reply.status(404).send({ error: 'User not found' })
        return reply.send({ success: true })
    })

    // ---------- Billing ----------
    fastify.get('/api/t/:slug/admin/billing', {
        preHandler: [tenantResolver, tenantGuard],
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const billing = await getBilling(tenantId)
        return reply.send(billing)
    })
}
