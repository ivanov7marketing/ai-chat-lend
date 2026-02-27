import { pool } from '../db/client'

interface ApartmentParams {
    area?: string
    rooms?: string
    repairType?: string
    design?: string
    condition?: string
    ceilingHeight?: string
    wallMaterial?: string
    blueprint?: string
}

interface LeadData {
    phone: string
    contactType: string
    apartmentParams: ApartmentParams
    selectedSegment: string
    estimateMin: number
    estimateMax: number
    sessionId: string
}

export async function sendLeadToAmoCRM(tenantId: string | null, leadData: LeadData) {
    if (!tenantId) return { success: false, message: 'No tenant ID' }

    try {
        const res = await pool.query(
            `SELECT amocrm_webhook_url, amocrm_api_key, amocrm_field_mapping
             FROM tenant_integrations WHERE tenant_id = $1`,
            [tenantId]
        )

        if (res.rows.length === 0) return { success: false, message: 'Integration not found' }

        const config = res.rows[0]
        if (!config.amocrm_webhook_url) return { success: false, message: 'Webhook URL not configured' }

        const mapping = config.amocrm_field_mapping || []

        // Formulate mapping based on system fields
        const systemValues: Record<string, string | number> = {
            'phone': leadData.phone,
            'contactType': leadData.contactType,
            'area': leadData.apartmentParams?.area || '',
            'rooms': leadData.apartmentParams?.rooms || '',
            'repairType': leadData.apartmentParams?.repairType || '',
            'design': leadData.apartmentParams?.design || '',
            'condition': leadData.apartmentParams?.condition || '',
            'segment': leadData.selectedSegment || '',
            'estimateMin': leadData.estimateMin || 0,
            'estimateMax': leadData.estimateMax || 0,
            'sessionId': leadData.sessionId || ''
        }

        const customFieldsValues: any[] = []

        mapping.forEach((m: any) => {
            if (m.crmFieldId && m.systemField && systemValues[m.systemField] !== undefined) {
                const id = parseInt(m.crmFieldId, 10)
                if (!isNaN(id)) {
                    customFieldsValues.push({
                        field_id: id,
                        values: [
                            { value: String(systemValues[m.systemField]) }
                        ]
                    })
                }
            }
        })

        // flat payload for simpler webhooks
        const flatPayload: any = {
            name: `Смета ${leadData.apartmentParams?.area || ''}м2 (${leadData.selectedSegment || ''})`,
            price: leadData.estimateMax || 0,
            ...systemValues
        }

        // Standard amoCRM v4 Array payload if custom fields exist
        let amocrmPayload: any = [
            {
                name: flatPayload.name,
                price: flatPayload.price,
                ...(customFieldsValues.length > 0 ? { custom_fields_values: customFieldsValues } : {})
            }
        ]

        // Decide what to send: if they mapped fields with IDs, use amoCRM format, else flat JSON
        const payloadToSend = mapping.length > 0 ? amocrmPayload : flatPayload

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        if (config.amocrm_api_key) {
            // Bearer is usually used for AmoCRM OAuth
            headers['Authorization'] = `Bearer ${config.amocrm_api_key}`
        }

        const response = await fetch(config.amocrm_webhook_url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payloadToSend)
        })

        if (!response.ok) {
            const errBody = await response.text()
            console.error('[amoCRM error]', response.status, errBody)
            return { success: false, message: `HTTP ${response.status}: ${errBody}` }
        }

        return { success: true, message: 'Successfully sent to amoCRM' }

    } catch (err: any) {
        console.error('[amoCRM exception]', err)
        return { success: false, message: err.message }
    }
}
