import { pool } from '../db/client'
import { generatePdfFromHtml } from './pdfGenerator'
import fs from 'fs/promises'
import path from 'path'
import { uploadFile } from './s3Service'

/**
 * Generates an invoice and saves it to DB and S3
 */
export async function createInvoice(
    tenantId: string,
    data: {
        plan: string
        months: number
        amount: number
        createdBy: 'tenant' | 'superadmin'
    }
) {
    // 1. Get tenant info
    const tenantRes = await pool.query(
        'SELECT slug, company_name, email FROM tenants WHERE id = $1',
        [tenantId]
    )
    const tenant = tenantRes.rows[0]

    // 2. Generate invoice number
    const year = new Date().getFullYear()
    const countRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM invoices WHERE invoice_number LIKE $1",
        [`INV-${year}-%`]
    )
    const invoiceNumber = `INV-${year}-${String(countRes.rows[0].count + 1).padStart(4, '0')}`

    // 3. Prepare HTML
    const templatePath = path.join(__dirname, '../assets/invoice_template.html')
    let html = await fs.readFile(templatePath, 'utf-8')

    html = html
        .replace('{{invoiceNumber}}', invoiceNumber)
        .replace('{{date}}', new Date().toLocaleDateString('ru-RU'))
        .replace('{{companyName}}', tenant.company_name)
        .replace('{{slug}}', tenant.slug)
        .replace('{{email}}', tenant.email)
        .replace('{{plan}}', data.plan.toUpperCase())
        .replace('{{months}}', String(data.months))
        .replace('{{amount}}', String(data.amount))

    // 4. Generate PDF
    const pdfBuffer = await generatePdfFromHtml(html)

    // 5. Upload to S3
    const s3Key = `invoices/${tenantId}/${invoiceNumber}.pdf`
    await uploadFile(pdfBuffer, s3Key, 'application/pdf')

    // 6. Save to DB
    const res = await pool.query(
        `INSERT INTO invoices 
         (tenant_id, invoice_number, created_by, plan, months, amount, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
         RETURNING *`,
        [tenantId, invoiceNumber, data.createdBy, data.plan, data.months, data.amount]
    )

    return res.rows[0]
}

/**
 * Marks an invoice as paid and updates tenant's plan
 */
export async function markInvoicePaid(invoiceId: string, adminId: string) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Update invoice status
        const invoiceRes = await client.query(
            `UPDATE invoices SET status = 'paid', paid_at = NOW(), paid_by = $2
             WHERE id = $1 AND status = 'pending'
             RETURNING tenant_id, plan, months`,
            [invoiceId, adminId]
        )

        if (invoiceRes.rows.length === 0) {
            throw new Error('Invoice not found or already paid')
        }

        const { tenant_id, plan, months } = invoiceRes.rows[0]

        // 2. Calculate new expiry date
        // If current plan is active and same, extend it. Else start from now.
        const tenantRes = await client.query(
            'SELECT plan, plan_expires_at FROM tenants WHERE id = $1',
            [tenant_id]
        )
        const tenant = tenantRes.rows[0]

        let startDate = new Date()
        if (tenant.plan === plan && tenant.plan_expires_at && new Date(tenant.plan_expires_at) > new Date()) {
            startDate = new Date(tenant.plan_expires_at)
        }

        const expiryDate = new Date(startDate)
        expiryDate.setMonth(expiryDate.getMonth() + months)

        // 3. Update tenant plan
        await client.query(
            `UPDATE tenants 
             SET plan = $2, plan_expires_at = $3, updated_at = NOW()
             WHERE id = $1`,
            [tenant_id, plan, expiryDate]
        )

        await client.query('COMMIT')
        return { success: true }
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function getTenantInvoices(tenantId: string) {
    const res = await pool.query(
        'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC',
        [tenantId]
    )
    return res.rows
}

export async function getAllInvoices() {
    const res = await pool.query(
        `SELECT i.*, t.company_name as tenant_name 
         FROM invoices i
         JOIN tenants t ON t.id = i.tenant_id
         ORDER BY i.created_at DESC`
    )
    return res.rows
}
