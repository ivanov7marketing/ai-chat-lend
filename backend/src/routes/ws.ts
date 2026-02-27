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
    // Simple Memory store for WebSocket clients by Session ID
    // ============================================================
    // To route messages between the frontend widget and the admin panel
    // This allows the manager to join the same "room" as the user and
    // see exactly what messages are being sent and received.
    const rooms = new Map<string, Set<WebSocket>>()

    function joinRoom(sessionId: string, socket: WebSocket) {
        if (!rooms.has(sessionId)) {
            rooms.set(sessionId, new Set())
        }
        rooms.get(sessionId)!.add(socket)
    }

    function leaveRoom(sessionId: string, socket: WebSocket) {
        const room = rooms.get(sessionId)
        if (room) {
            room.delete(socket)
            if (room.size === 0) {
                rooms.delete(sessionId)
            }
        }
    }

    function broadcastToRoom(sessionId: string, message: any, excludeSocket?: WebSocket) {
        const room = rooms.get(sessionId)
        if (room) {
            const data = JSON.stringify(message)
            for (const client of room) {
                if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
                    client.send(data)
                }
            }
        }
    }

    // ============================================================
    // Multi-tenant: /ws/:slug
    // ============================================================
    fastify.get('/ws/:slug', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
        let sessionId: string | null = null
        let tenantId: string | null = null
        let isAdmin = false
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

                    // Admin connect check (we can pass a query param or determine it via other means)
                    if ((req.query as Record<string, string>).role === 'admin') {
                        isAdmin = true
                        socket.send(JSON.stringify({ type: 'admin_ready' }))
                    } else {
                        // Auto-create session for user widget
                        const utmSource = (req.query as Record<string, string>).utm_source
                        const device = req.headers['user-agent'] || 'unknown'
                        sessionId = await createSession(utmSource, device, tenantId || undefined)
                        joinRoom(sessionId, socket)
                        socket.send(JSON.stringify({ type: 'session_created', sessionId, tenantId }))
                    }
                } catch (err) {
                    console.error('WS tenant resolve error:', err)
                    socket.close()
                }
            })()

        socket.on('message', async (raw: Buffer) => {
            try {
                const data = JSON.parse(raw.toString())

                // --- Admin WS Events ---
                if (isAdmin) {
                    if (data.type === 'admin_join' && data.sessionId) {
                        sessionId = data.sessionId
                        joinRoom(sessionId!, socket)
                        // Send confirmation
                        socket.send(JSON.stringify({ type: 'admin_joined', sessionId }))
                    } else if (data.type === 'manager_takeover' && sessionId) {
                        // Mark session as human managed
                        const { setHumanManaged } = await import('../services/sessionService')
                        await setHumanManaged(sessionId, true)

                        // Notify all clients in the room (including the admin who initiated it)
                        broadcastToRoom(sessionId, { type: 'takeover_active' })
                    } else if (data.type === 'manager_message' && sessionId) {
                        await saveMessage(sessionId, 'manager', data.content)
                        // Broadcast the manager's message to the widget
                        broadcastToRoom(sessionId, {
                            type: 'message',
                            role: 'manager',
                            content: data.content,
                            id: Date.now().toString()
                        }, socket) // Exclude sender
                        // Also acknowledge to the sending admin
                        socket.send(JSON.stringify({ type: 'ack', messageId: data.id || Date.now().toString() }))
                    }
                    return
                }

                // --- Client Widget WS Events ---
                if (data.type === 'message' && sessionId) {
                    await saveMessage(sessionId, data.role, data.content)
                    socket.send(JSON.stringify({ type: 'ack', messageId: data.id }))

                    // Broadcast user messages to any listening admins
                    if (data.role === 'user') {
                        broadcastToRoom(sessionId, {
                            type: 'message',
                            role: 'user',
                            content: data.content,
                            id: data.id
                        }, socket)
                    }
                } else if (data.type === 'session_close' && sessionId) {
                    await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1`, [sessionId])
                }
            } catch (e) {
                console.error('WS message error:', e)
            }
        })

        socket.on('close', async () => {
            console.log(`[${slug}] Session closed: ${sessionId} (Admin: ${isAdmin})`)
            if (sessionId) {
                leaveRoom(sessionId, socket)
                if (!isAdmin) {
                    // Fallback to close session if it is still active (only user drops)
                    await pool.query(`UPDATE sessions SET status = 'closed' WHERE id = $1 AND status = 'active'`, [sessionId])
                }
            }
        })
    })
}
