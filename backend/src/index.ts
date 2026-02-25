import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'

dotenv.config()

const server = Fastify({
    logger: true
})

server.register(cors, {
    origin: '*'
})

server.get('/health', async (request, reply) => {
    return { status: 'ok' }
})

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' })
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()
