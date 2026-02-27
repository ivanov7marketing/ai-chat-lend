import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getEstimateById } from '../services/estimateService'
import { getSignedFileUrl } from '../services/s3Service'

export async function estimatesRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/estimates/:id/download
     * Returns a signed URL for the estimate PDF
     */
    fastify.get('/api/estimates/:id/download', async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string }

        const estimate = await getEstimateById(id)
        if (!estimate) {
            return reply.status(404).send({ error: 'Estimate not found' })
        }

        if (!estimate.pdf_url) {
            return reply.status(404).send({ error: 'PDF not generated yet' })
        }

        try {
            // pdf_url stores the S3 key
            const signedUrl = await getSignedFileUrl(estimate.pdf_url)
            return reply.send({ url: signedUrl })
        } catch (error) {
            console.error('Error generating signed URL:', error)
            return reply.status(500).send({ error: 'Failed to generate download link' })
        }
    })
}
