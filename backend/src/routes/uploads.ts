import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { uploadFile } from '../services/s3Service'
import { tenantResolver, getTenantId } from '../middleware/tenantResolver'
import { authGuard } from '../middleware/authGuard'

export async function uploadsRoutes(fastify: FastifyInstance) {
    const tenantGuard = authGuard(['tenant_owner', 'tenant_user'])

    /**
     * POST /api/t/:slug/admin/upload
     * Handles image uploads (avatar, logo) for a tenant
     */
    fastify.post('/api/t/:slug/admin/upload', {
        preHandler: [tenantResolver, tenantGuard]
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const tenantId = getTenantId(req)
        const data = await req.file()

        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' })
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        if (!allowedMimeTypes.includes(data.mimetype)) {
            return reply.status(400).send({ error: 'Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.' })
        }

        const buffer = await data.toBuffer()
        const extension = data.mimetype.split('/')[1].replace('+xml', 'svg')
        const fileKey = `tenants/${tenantId}/assets/${Date.now()}.${extension}`

        try {
            const result = await uploadFile(buffer, fileKey, data.mimetype)
            return reply.send({
                success: true,
                key: result.key,
                url: result.url // Note: if bucket is private, this URL won't work directly without signed URL
            })
        } catch (error) {
            console.error('Upload Error:', error)
            return reply.status(500).send({ error: 'Failed to upload file to S3' })
        }
    })
}
