import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
    registerTenant,
    loginTenant,
    loginSuperAdmin,
    refreshTokens,
    checkSlugAvailability,
    AuthError,
    RegisterInput,
    LoginInput,
} from '../services/authService'

export async function authRoutes(fastify: FastifyInstance) {

    // ============ Регистрация тенанта ============
    fastify.post<{ Body: RegisterInput }>('/api/auth/register', async (req, reply) => {
        try {
            const { slug, companyName, email, password, phone, city } = req.body

            if (!slug || !companyName || !email || !password) {
                return reply.status(400).send({ error: 'Все обязательные поля должны быть заполнены' })
            }
            if (password.length < 8) {
                return reply.status(400).send({ error: 'Пароль должен содержать минимум 8 символов' })
            }

            const result = await registerTenant({ slug, companyName, email, password, phone, city })

            return reply.status(201).send({
                success: true,
                tenantId: result.tenantId,
                slug: result.slug,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        } catch (err) {
            if (err instanceof AuthError) {
                return reply.status(err.statusCode).send({ error: err.message })
            }
            throw err
        }
    })

    // ============ Логин тенанта ============
    fastify.post<{ Body: LoginInput }>('/api/auth/login', async (req, reply) => {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return reply.status(400).send({ error: 'Email и пароль обязательны' })
            }

            const result = await loginTenant({ email, password })

            return reply.send({
                success: true,
                tenantId: result.tenantId,
                slug: result.slug,
                companyName: result.companyName,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        } catch (err) {
            if (err instanceof AuthError) {
                return reply.status(err.statusCode).send({ error: err.message })
            }
            throw err
        }
    })

    // ============ Логин суперадмина ============
    fastify.post<{ Body: LoginInput }>('/api/auth/superadmin', async (req, reply) => {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return reply.status(400).send({ error: 'Email и пароль обязательны' })
            }

            const result = await loginSuperAdmin({ email, password })

            return reply.send({
                success: true,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        } catch (err) {
            if (err instanceof AuthError) {
                return reply.status(err.statusCode).send({ error: err.message })
            }
            throw err
        }
    })

    // ============ Обновить токены ============
    fastify.post<{ Body: { refreshToken: string } }>('/api/auth/refresh', async (req, reply) => {
        try {
            const { refreshToken } = req.body
            if (!refreshToken) {
                return reply.status(400).send({ error: 'Refresh token обязателен' })
            }

            const tokens = refreshTokens(refreshToken)
            return reply.send({ success: true, ...tokens })
        } catch {
            return reply.status(401).send({ error: 'Невалидный refresh token' })
        }
    })

    // ============ Проверка slug ============
    fastify.get<{ Querystring: { slug: string } }>('/api/auth/check-slug', async (req, reply) => {
        const slug = (req.query as { slug?: string }).slug
        if (!slug) {
            return reply.status(400).send({ error: 'Параметр slug обязателен' })
        }
        const available = await checkSlugAvailability(slug)
        return reply.send({ available, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '') })
    })
}
