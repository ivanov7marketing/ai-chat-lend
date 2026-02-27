import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import { runMigrations } from './db/migrate'
import fastifyWebsocket from '@fastify/websocket'
import { wsRoutes } from './routes/ws'
import { leadsRoutes } from './routes/leads'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { tenantPublicRoutes } from './routes/tenantPublic'
import { superAdminRoutes } from './routes/superAdmin'

dotenv.config()

const server = Fastify({
    logger: true
})

server.register(cors, {
    origin: '*'
})

server.register(fastifyWebsocket)
server.register(wsRoutes)
server.register(leadsRoutes)
server.register(adminRoutes)
server.register(authRoutes)
server.register(tenantPublicRoutes)
server.register(superAdminRoutes)

server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok' })
})

import { initQdrant } from './services/qdrantClient'

const start = async () => {
    try {
        await runMigrations()
        await initQdrant()
        await server.listen({ port: 3001, host: '0.0.0.0' })
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()
