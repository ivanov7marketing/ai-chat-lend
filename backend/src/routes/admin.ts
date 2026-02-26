import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getDialogsList, getDialogDetail, updatePrices } from '../services/adminService'

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.get('/api/admin/dialogs', async (req: FastifyRequest, reply: FastifyReply) => {
        const query = req.query as { limit?: string; offset?: string }
        const limit = query.limit ? parseInt(query.limit, 10) : 50
        const offset = query.offset ? parseInt(query.offset, 10) : 0

        try {
            const list = await getDialogsList(limit, offset)
            return reply.send(list)
        } catch (e) {
            fastify.log.error(e, 'Error fetching dialogs list:')
            return reply.status(500).send({ error: 'Internal server error' })
        }
    })

    fastify.get('/api/admin/dialog/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }
        try {
            const detail = await getDialogDetail(id)
            if (!detail) {
                return reply.status(404).send({ error: 'Session not found' })
            }
            return reply.send(detail)
        } catch (e) {
            fastify.log.error(e, `Error fetching dialog ${id}:`)
            return reply.status(500).send({ error: 'Internal server error' })
        }
    })

    fastify.put('/api/admin/prices', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const result = await updatePrices()
            return reply.send(result)
        } catch (e) {
            fastify.log.error(e, 'Error updating prices:')
            return reply.status(500).send({ error: 'Internal server error' })
        }
    })
}
