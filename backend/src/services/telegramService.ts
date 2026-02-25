import dotenv from 'dotenv'
dotenv.config()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramNotification(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram not configured, skipping notification')
        return
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'HTML',
        }),
    })
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
        `📱 Контакт: <b>${data.contact}</b> (${data.contactType})\n` +
        `🏠 Квартира: ${data.rooms}-комн., ${data.area} м²\n` +
        `🔨 Ремонт: ${data.repairType}` +
        (data.design && data.design !== 'Нет' ? `, ${data.design}` : '') + `\n` +
        `💎 Сегмент: ${data.segment}\n` +
        `💰 Оценка: от ${data.estimateMin.toLocaleString('ru-RU')} до ${data.estimateMax.toLocaleString('ru-RU')} руб.\n\n` +
        `🆔 Сессия: <code>${data.sessionId}</code>`
    )
}
