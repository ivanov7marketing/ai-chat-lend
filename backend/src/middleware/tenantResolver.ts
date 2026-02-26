import { FastifyRequest, FastifyReply } from 'fastify'
import { pool } from '../db/client'

/**
 * Tenant Resolver Middleware
 * Извлекает slug из URL-параметра `:slug`, ищет тенанта в БД
 * и прикрепляет tenant к объекту запроса.
 *
 * Используется для маршрутов:
 *   /api/t/:slug/*            — публичные API тенанта
 *   /api/t/:slug/admin/*      — админка тенанта
 */

export interface TenantInfo {
    id: string
    slug: string
    company_name: string
    plan: string
    is_active: boolean
}

// Кеш тенантов в памяти (TTL 60 сек) — чтобы не долбить БД на каждый запрос
const tenantCache = new Map<string, { tenant: TenantInfo; expires: number }>()
const CACHE_TTL_MS = 60_000

function getCachedTenant(slug: string): TenantInfo | null {
    const entry = tenantCache.get(slug)
    if (!entry) return null
    if (Date.now() > entry.expires) {
        tenantCache.delete(slug)
        return null
    }
    return entry.tenant
}

function setCachedTenant(slug: string, tenant: TenantInfo) {
    tenantCache.set(slug, { tenant, expires: Date.now() + CACHE_TTL_MS })
}

export async function tenantResolver(req: FastifyRequest, reply: FastifyReply) {
    const { slug } = req.params as { slug: string }

    if (!slug) {
        return reply.status(400).send({ error: 'Tenant slug is required' })
    }

    // Проверить кеш
    let tenant = getCachedTenant(slug)

    if (!tenant) {
        const res = await pool.query(
            `SELECT id, slug, company_name, plan, is_active
             FROM tenants WHERE slug = $1`,
            [slug]
        )

        if (res.rows.length === 0) {
            return reply.status(404).send({ error: 'Tenant not found' })
        }

        tenant = res.rows[0] as TenantInfo
        setCachedTenant(slug, tenant)
    }

    if (!tenant.is_active) {
        return reply.status(403).send({ error: 'Tenant is deactivated' })
    }

    // Прикрепляем к запросу
    ; (req as any).tenant = tenant
        ; (req as any).tenantId = tenant.id
}

/**
 * Получить tenantId из запроса (после tenantResolver)
 */
export function getTenantId(req: FastifyRequest): string {
    const id = (req as any).tenantId
    if (!id) throw new Error('tenantResolver middleware not applied')
    return id
}

/**
 * Получить полный объект тенанта из запроса
 */
export function getTenant(req: FastifyRequest): TenantInfo {
    const tenant = (req as any).tenant
    if (!tenant) throw new Error('tenantResolver middleware not applied')
    return tenant
}

/**
 * Invalidate cache for a specific tenant (call after settings update)
 */
export function invalidateTenantCache(slug: string) {
    tenantCache.delete(slug)
}
