import { FastifyInstance, FastifyRequest } from 'fastify'
import { WebSocket } from 'ws'
import { createSession, saveMessage } from '../services/sessionService'
import { pool } from '../db/client'
import { handleFreeChat } from '../services/chatService'

export async function wsRoutes(fastify: FastifyInstance) {
    // ============================================================
    // Обратная совместимость: /ws (без tenant)
    // ============================================================
    fastify.get('/ws', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
        let sessionId: string | null = null

        socket.on('open', async () => {
            const utmSource = (req.query as Record<string, string>).utm_source
            const device = req.headers['user-agent'] || 'unknown'
            sessionId = await createSession(utmSource, device)
            socket.send(JSON.stringify({ type: 'session_created', sessionId }))
        })

        socket.on('message', async (raw: Buffer) => {
            try {
                const data = JSON.parse(raw.toString())

                if (data.type === 'message' && sessionId) {
                    await saveMessage(sessionId, data.role, data.content)
                    socket.send(JSON.stringify({ type: 'ack', messageId: data.id }))
                } else if (data.type === 'session_close' && sessionId) {
                    await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1`, [sessionId])
                }
            } catch (e) {
                console.error('WS message error:', e)
            }
        })

        socket.on('close', async () => {
            console.log(`Session closed: ${sessionId}`)
            if (sessionId) {
                // Fallback to close session if it is still active
                await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1 AND status = 'active'`, [sessionId])
            }
        })
    })

    // ============================================================
    // Multi-tenant: /ws/:slug
    // ============================================================
    fastify.get('/ws/:slug', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
        let sessionId: string | null = null
        let tenantId: string | null = null
        const { slug } = req.params as { slug: string }

            // Resolve tenant at connection time
            ; (async () => {
                try {
                    const res = await pool.query(
                        `SELECT id, is_active FROM tenants WHERE slug = $1`, [slug]
                    )
                    if (res.rows.length === 0 || !res.rows[0].is_active) {
                        socket.send(JSON.stringify({ type: 'error', message: 'Tenant not found or inactive' }))
                        socket.close()
                        return
                    }
                    tenantId = res.rows[0].id

                    // Auto-create session
                    const utmSource = (req.query as Record<string, string>).utm_source
                    const device = req.headers['user-agent'] || 'unknown'
                    sessionId = await createSession(utmSource, device, tenantId || undefined)
                    socket.send(JSON.stringify({ type: 'session_created', sessionId, tenantId }))
                } catch (err) {
                    console.error('WS tenant resolve error:', err)
                    socket.close()
                }
            })()

        socket.on('message', async (raw: Buffer) => {
            try {
                const data = JSON.parse(raw.toString())

                if (data.type === 'message' && sessionId) {
                    await saveMessage(sessionId, data.role, data.content)
                    socket.send(JSON.stringify({ type: 'ack', messageId: data.id }))
                } else if (data.type === 'session_close' && sessionId) {
                    await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1`, [sessionId])
                }
            } catch (e) {
                console.error('WS message error:', e)
            }
        })

        socket.on('close', async () => {
            console.log(`[${slug}] Session closed: ${sessionId}`)
            if (sessionId) {
                // Fallback to close session if it is still active
                await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1 AND status = 'active'`, [sessionId])
            }
        })
    })
}
