import type {
    PlatformMetrics,
    TenantListItem,
    TenantDetailData,
    TenantFilters,
    AuditLogEntry,
} from '../types/auth'

const API_BASE = (import.meta as any).env.VITE_API_URL || ''

function getToken(): string {
    return localStorage.getItem('auth_token') || ''
}

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const token = getToken()
    const res = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
        ...options,
    })
    if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error')
        throw new Error(`API ${res.status}: ${text}`)
    }
    return res.json()
}

// ============ Dashboard ============

export async function getDashboard(): Promise<PlatformMetrics> {
    try {
        return await adminFetch<PlatformMetrics>('/api/superadmin/dashboard')
    } catch {
        // Fallback mock for development
        return {
            totalTenants: 0,
            activeTenants: 0,
            newTenants: 0,
            totalSessions: 0,
            totalLeads: 0,
            mrr: 0,
        }
    }
}

// ============ Tenants ============

export async function getTenants(
    filters: TenantFilters,
    limit = 20,
    offset = 0
): Promise<{ data: TenantListItem[]; total: number }> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    })
    if (filters.search) params.set('search', filters.search)
    if (filters.plan !== 'all') params.set('plan', filters.plan)
    if (filters.status !== 'all') params.set('status', filters.status)

    try {
        return await adminFetch(`/api/superadmin/tenants?${params.toString()}`)
    } catch {
        return { data: [], total: 0 }
    }
}

export async function getTenantDetail(id: string): Promise<TenantDetailData | null> {
    try {
        return await adminFetch<TenantDetailData>(`/api/superadmin/tenants/${id}`)
    } catch {
        return null
    }
}

export async function updateTenant(
    id: string,
    data: Partial<{ plan: string; isActive: boolean }>
): Promise<void> {
    await adminFetch(`/api/superadmin/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function blockTenant(id: string): Promise<void> {
    await adminFetch(`/api/superadmin/tenants/${id}/block`, { method: 'POST' })
}

export async function unblockTenant(id: string): Promise<void> {
    await adminFetch(`/api/superadmin/tenants/${id}/unblock`, { method: 'POST' })
}

// ============ Audit Log ============

export async function getAuditLog(
    limit = 50,
    offset = 0
): Promise<{ data: AuditLogEntry[]; total: number }> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    })
    try {
        return await adminFetch(`/api/superadmin/audit?${params.toString()}`)
    } catch {
        return { data: [], total: 0 }
    }
}
// ============ Invoices ============

export async function getAllInvoices(): Promise<{ data: any[] }> {
    return adminFetch('/api/superadmin/invoices')
}

export async function markInvoicePaid(id: string): Promise<void> {
    await adminFetch(`/api/superadmin/invoices/${id}/pay`, { method: 'PUT' })
}
