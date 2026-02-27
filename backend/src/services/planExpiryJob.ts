import cron from 'node-cron'
import { pool } from '../db/client'
import { sendTelegramNotification } from './telegramService'

/**
 * Daily job to check for expiring and expired plans
 * Runs every day at 03:00
 */
export function initPlanExpiryJob() {
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] Running plan expiry check...')
        await checkExpiringPlans()
        await checkExpiredPlans()
    })
}

async function checkExpiringPlans() {
    // 1. Find tenants whose plan expires in 7 or 3 days
    const res = await pool.query(`
        SELECT id, slug, company_name, email, plan, plan_expires_at 
        FROM tenants 
        WHERE plan != 'free' 
          AND is_active = TRUE
          AND (
            (plan_expires_at::date = (NOW() + INTERVAL '7 days')::date)
            OR (plan_expires_at::date = (NOW() + INTERVAL '3 days')::date)
          )
    `)

    for (const tenant of res.rows) {
        const daysLeft = Math.ceil((new Date(tenant.plan_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

        const message = `⚠️ <b>Срок действия тарифа истекает</b>\n\n` +
            `Тенант: ${tenant.company_name} (@${tenant.slug})\n` +
            `Тариф: ${tenant.plan.toUpperCase()}\n` +
            `Осталось дней: ${daysLeft}\n` +
            `Дата окончания: ${new Date(tenant.plan_expires_at).toLocaleDateString('ru-RU')}\n\n` +
            `Пожалуйста, выставьте новый счёт для продления.`

        // Notify superadmin via Telegram
        await sendTelegramNotification(message)

        // TODO: Send email to tenant via Nodemailer
        console.log(`[Cron] Notified about expiring plan for ${tenant.slug} (${daysLeft} days left)`)
    }
}

async function checkExpiredPlans() {
    // 1. Find tenants whose plan has already expired
    const res = await pool.query(`
        SELECT id, slug, company_name, email, plan, plan_expires_at 
        FROM tenants 
        WHERE plan != 'free' 
          AND plan_expires_at < NOW()
    `)

    for (const tenant of res.rows) {
        await pool.query(
            "UPDATE tenants SET plan = 'free', plan_expires_at = NULL, updated_at = NOW() WHERE id = $1",
            [tenant.id]
        )

        const message = `🚫 <b>Тариф истек и был понижен до Free</b>\n\n` +
            `Тенант: ${tenant.company_name} (@${tenant.slug})\n` +
            `Был тариф: ${tenant.plan.toUpperCase()}\n` +
            `Дата окончания: ${new Date(tenant.plan_expires_at).toLocaleDateString('ru-RU')}`

        await sendTelegramNotification(message)
        console.log(`[Cron] Plan expired for ${tenant.slug}. Downgraded to free.`)
    }
}
