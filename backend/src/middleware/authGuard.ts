import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

/**
 * JWT Payload для всех типов авторизации
 */
export interface JWTPayload {
    type: 'tenant_owner' | 'tenant_user' | 'superadmin'
    userId: string
    tenantId?: string   // для tenant_owner и tenant_user
    role: string
    email: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me'

/**
 * Генерация access token (15 минут)
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

/**
 * Генерация refresh token (7 дней)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

/**
 * Верификация access token
 */
export function verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
}

/**
 * Верификация refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
}

/**
 * Auth Guard — middleware factory
 * @param allowedTypes — список допустимых типов JWT (например, ['tenant_owner', 'tenant_user'])
 */
export function authGuard(allowedTypes: JWTPayload['type'][]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        // Извлечь токен из заголовка Authorization: Bearer <token>
        const authHeader = req.headers.authorization
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null

        if (!token) {
            return reply.status(401).send({ error: 'Authorization token required' })
        }

        let payload: JWTPayload
        try {
            payload = verifyAccessToken(token)
        } catch {
            return reply.status(401).send({ error: 'Invalid or expired token' })
        }

        // Проверить тип пользователя
        if (!allowedTypes.includes(payload.type)) {
            return reply.status(403).send({ error: 'Insufficient permissions' })
        }

        // Для тенант-пользователей: tenant_id в JWT должен совпадать с tenant_id из URL
        if (payload.tenantId && (req as any).tenantId) {
            if (payload.tenantId !== (req as any).tenantId) {
                return reply.status(403).send({ error: 'Access denied to this tenant' })
            }
        }

        // Прикрепляем payload к запросу
        ; (req as any).auth = payload
            ; (req as any).userId = payload.userId
    }
}

/**
 * Получить JWT payload из запроса (после authGuard)
 */
export function getAuth(req: FastifyRequest): JWTPayload {
    const auth = (req as any).auth
    if (!auth) throw new Error('authGuard middleware not applied')
    return auth
}
