import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pool } from '../db/client'
import { sendTelegramNotification, formatLeadMessage, sendTelegramDocument } from '../services/telegramService'
import { updateSessionStatus, incrementTenantUsage } from '../services/sessionService'
import { generateEstimateHtml } from '../services/pdfTemplateService'
import { generatePdfFromHtml } from '../services/pdfGenerator'
import { createEstimate } from '../services/estimateService'
import { sendLeadToAmoCRM } from '../services/amocrmService'
import { uploadFile } from '../services/s3Service'

interface ApartmentParams {
    area: string
    rooms: string
    repairType: string
    design?: string
    condition?: string
    ceilingHeight?: string
    wallMaterial?: string
    blueprint?: string
}

interface LeadBody {
    sessionId: string
    contactType: string
    phone: string
    apartmentParams: ApartmentParams
    selectedSegment: string
    estimateMin: number
    estimateMax: number
}

export async function leadsRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: LeadBody }>('/api/leads', async (req: FastifyRequest<{ Body: LeadBody }>, reply: FastifyReply) => {
        const {
            sessionId,
            contactType,
            phone,
            apartmentParams,
            selectedSegment,
            estimateMin,
            estimateMax,
        } = req.body

        if (!phone || !sessionId) {
            return reply.status(400).send({ error: 'Missing required fields' })
        }

        // Resolve tenant_id from session
        let tenantId: string | null = null
        if (sessionId && sessionId !== 'anonymous') {
            const sessionRes = await pool.query(
                `SELECT tenant_id FROM sessions WHERE id = $1`,
                [sessionId]
            )
            if (sessionRes.rows.length > 0) {
                tenantId = sessionRes.rows[0].tenant_id
            }
        }

        // Сохранить лид в БД с tenant_id
        await pool.query(
            `INSERT INTO leads
        (session_id, tenant_id, contact_type, contact_value, apartment_params,
         estimate_min, estimate_max, selected_segment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                sessionId && sessionId !== 'anonymous' ? sessionId : null,
                tenantId,
                contactType,
                phone,
                JSON.stringify(apartmentParams),
                estimateMin,
                estimateMax,
                selectedSegment,
            ]
        )

        // Обновить статус сессии
        await updateSessionStatus(sessionId, 'converted')

        // Инкремент leads_count
        if (tenantId) {
            await incrementTenantUsage(tenantId, 'leads_count')
        }

        // Отправить уведомление в Telegram (per-tenant)
        const message = formatLeadMessage({
            contact: phone,
            contactType,
            area: apartmentParams.area,
            rooms: apartmentParams.rooms,
            repairType: apartmentParams.repairType,
            design: apartmentParams.design,
            segment: selectedSegment,
            estimateMin,
            estimateMax,
            sessionId,
        })
        await sendTelegramNotification(message, tenantId || undefined)

        // Отправить лид в amoCRM асинхронно
        sendLeadToAmoCRM(tenantId, {
            phone,
            contactType,
            apartmentParams,
            selectedSegment,
            estimateMin,
            estimateMax,
            sessionId
        }).catch(err => console.error('Error sending lead to amoCRM:', err))

        // Асинхронно генерируем PDF (основной ответ уже отдан, но можно и дождаться)
        try {
            const html = await generateEstimateHtml(
                tenantId,
                apartmentParams as any,
                selectedSegment,
                estimateMin,
                estimateMax
            )

            const pdfBuffer = await generatePdfFromHtml(html)

            const pdfKey = `estimates/pdfs/${tenantId || 'global'}/${sessionId}_${Date.now()}.pdf`
            const uploadResult = await uploadFile(pdfBuffer, pdfKey, 'application/pdf')

            await createEstimate(
                sessionId && sessionId !== 'anonymous' ? sessionId : null,
                tenantId,
                apartmentParams,
                { min: estimateMin, max: estimateMax, segment: selectedSegment },
                uploadResult.key
            )

            const filename = `Смета_AI_Max_${String(apartmentParams.area).replace('.', '_')}m2.pdf`
            await sendTelegramDocument(
                pdfBuffer,
                filename,
                '📄 <b>Сгенерированная смета</b>',
                tenantId || undefined
            )
        } catch (pdfErr) {
            console.error('Failed to generate or send PDF:', pdfErr)
        }

        return reply.send({ success: true })
    })
}
