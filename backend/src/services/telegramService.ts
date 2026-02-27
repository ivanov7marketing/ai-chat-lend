import dotenv from 'dotenv'
import { pool } from '../db/client'

dotenv.config()

const GLOBAL_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GLOBAL_TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramNotification(text: string, tenantId?: string) {
    let botToken = GLOBAL_TELEGRAM_BOT_TOKEN
    let chatId = GLOBAL_TELEGRAM_CHAT_ID

    // Try to load tenant-specific Telegram credentials
    if (tenantId) {
        try {
            const res = await pool.query(
                `SELECT telegram_bot_token, telegram_chat_id
                 FROM tenant_integrations WHERE tenant_id = $1`,
                [tenantId]
            )
            if (res.rows.length > 0) {
                const row = res.rows[0]
                if (row.telegram_bot_token && row.telegram_chat_id) {
                    botToken = row.telegram_bot_token
                    chatId = row.telegram_chat_id
                }
            }
        } catch (err) {
            console.warn('Failed to load tenant Telegram config, using global:', err)
        }
    }

    if (!botToken || !chatId) {
        console.warn('Telegram not configured, skipping notification')
        return
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            }),
        })
    } catch (err) {
        console.error('Telegram notification error:', err)
    }
}

export async function sendTelegramDocument(
    pdfBuffer: Buffer,
    filename: string,
    caption: string,
    tenantId?: string
) {
    let botToken = GLOBAL_TELEGRAM_BOT_TOKEN
    let chatId = GLOBAL_TELEGRAM_CHAT_ID

    if (tenantId) {
        try {
            const res = await pool.query(
                `SELECT telegram_bot_token, telegram_chat_id
                 FROM tenant_integrations WHERE tenant_id = $1`,
                [tenantId]
            )
            if (res.rows.length > 0) {
                const row = res.rows[0]
                if (row.telegram_bot_token && row.telegram_chat_id) {
                    botToken = row.telegram_bot_token
                    chatId = row.telegram_chat_id
                }
            }
        } catch (err) {
            console.warn('Failed to load tenant Telegram config, using global:', err)
        }
    }

    if (!botToken || !chatId) {
        console.warn('Telegram not configured, skipping notification')
        return
    }

    const url = `https://api.telegram.org/bot${botToken}/sendDocument`
    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')

    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
    formData.append('document', blob, filename)

    try {
        await fetch(url, {
            method: 'POST',
            body: formData as any,
        })
    } catch (err) {
        console.error('Telegram document error:', err)
    }
}

export function formatLeadMessage(data: {
    contact: string
    contactType: string
    area: string
    rooms: string
    repairType: string
    design?: string
    segment: string
    estimateMin: number
    estimateMax: number
    sessionId: string
}): string {
    return (
        `🔔 <b>Новый лид!</b>\n\n` +
        `📱 Телефон: <b>${data.contact}</b>\n` +
        `📲 Канал: ${data.contactType}\n` +
        `🏠 Квартира: ${data.rooms}-комн., ${data.area} м²\n` +
        `🔨 Ремонт: ${data.repairType}` +
        (data.design && data.design !== 'Нет' ? `, ${data.design}` : '') + `\n` +
        `💎 Сегмент: ${data.segment}\n` +
        `💰 Оценка: от ${data.estimateMin.toLocaleString('ru-RU')} до ${data.estimateMax.toLocaleString('ru-RU')} руб.\n\n` +
        `🆔 Сессия: <code>${data.sessionId}</code>`
    )
}
