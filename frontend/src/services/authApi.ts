import type { AuthResponse, RegisterInput, SlugCheckResponse, TenantConfig } from '../types/auth'

const API_BASE = (import.meta as any).env.VITE_API_URL || ''

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    })
    if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error')
        throw new Error(`API ${res.status}: ${text}`)
    }
    return res.json()
}

// ============ Registration ============

export async function registerTenant(data: RegisterInput): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

// ============ Login ============

export async function loginTenant(
    email: string,
    password: string
): Promise<AuthResponse & { slug: string; companyName: string }> {
    return apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
}

export async function loginSuperAdmin(
    email: string,
    password: string
): Promise<AuthResponse> {
    return apiFetch('/api/auth/superadmin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
}

// ============ Token Refresh ============

export async function refreshTokens(
    refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
    return apiFetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    })
}

// ============ Slug Check ============

export async function checkSlug(slug: string): Promise<SlugCheckResponse> {
    return apiFetch<SlugCheckResponse>(`/api/auth/check-slug?slug=${encodeURIComponent(slug)}`)
}

// ============ Tenant Config (public) ============

export async function getTenantConfig(slug: string): Promise<TenantConfig> {
    return apiFetch<TenantConfig>(`/api/t/${encodeURIComponent(slug)}/config`)
}
