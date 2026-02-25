import { FastifyInstance } from 'fastify'
import { pool } from '../db/client'
import { sendTelegramNotification, formatLeadMessage } from '../services/telegramService'
import { updateSessionStatus } from '../services/sessionService'

interface LeadBody {
    sessionId: string
    contactType: 'Telegram' | 'WhatsApp' | 'Email'
    contactValue: string
    apartmentParams: {
        area: string
        rooms: string
        repairType: string
        design?: string
        condition?: string
        ceilingHeight?: string
        wallMaterial?: string
    }
    selectedSegment: string
    estimateMin: number
    estimateMax: number
}

export async function leadsRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: LeadBody }>('/api/leads', async (req, reply) => {
        const {
            sessionId,
            contactType,
            contactValue,
            apartmentParams,
            selectedSegment,
            estimateMin,
            estimateMax,
        } = req.body

        if (!contactValue || !sessionId) {
            return reply.status(400).send({ error: 'Missing required fields' })
        }

        // Сохранить лид в БД
        await pool.query(
            `INSERT INTO leads
        (session_id, contact_type, contact_value, apartment_params,
         estimate_min, estimate_max, selected_segment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                sessionId,
                contactType,
                contactValue,
                JSON.stringify(apartmentParams),
                estimateMin,
                estimateMax,
                selectedSegment,
            ]
        )

        // Обновить статус сессии
        await updateSessionStatus(sessionId, 'converted')

        // Отправить уведомление в Telegram
        const message = formatLeadMessage({
            contact: contactValue,
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
        await sendTelegramNotification(message)

        return reply.send({ success: true })
    })
}
