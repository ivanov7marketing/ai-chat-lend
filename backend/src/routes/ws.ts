import { FastifyInstance, FastifyRequest } from 'fastify'
import { WebSocket } from 'ws'
import { createSession, saveMessage } from '../services/sessionService'

export async function wsRoutes(fastify: FastifyInstance) {
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
                }
            } catch (e) {
                console.error('WS message error:', e)
            }
        })

        socket.on('close', () => {
            console.log(`Session closed: ${sessionId}`)
        })
    })
}
