import type {
    TenantBrandingData,
    TeamMember,
    BillingData,
} from '../types/admin';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

function getToken(): string {
    return localStorage.getItem('auth_token') || '';
}

function getAdminBase(slug?: string): string {
    const s = slug || localStorage.getItem('auth_slug') || '';
    return s ? `/api/t/${s}/admin` : '/api/admin';
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
}

// ============ Branding ============

export async function getBranding(): Promise<TenantBrandingData> {
    return apiFetch<TenantBrandingData>(`${getAdminBase()}/branding`);
}

export async function updateBranding(data: Partial<TenantBrandingData>): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/branding`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ============ Team ============

export async function getTeamMembers(): Promise<TeamMember[]> {
    return apiFetch<TeamMember[]>(`${getAdminBase()}/team`);
}

export async function addTeamMember(data: {
    email: string;
    password: string;
    name: string;
    role: string;
}): Promise<TeamMember> {
    return apiFetch<TeamMember>(`${getAdminBase()}/team`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTeamMember(
    userId: string,
    data: { role?: string; isActive?: boolean; name?: string }
): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/team/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function removeTeamMember(userId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/team/${userId}`, {
        method: 'DELETE',
    });
}

// ============ Billing ============

export async function getBilling(): Promise<BillingData> {
    return apiFetch<BillingData>(`${getAdminBase()}/billing`);
}

// ============ File Uploads ============

export async function uploadFile(file: File): Promise<{ key: string, url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();
    const res = await fetch(`${API_BASE}${getAdminBase()}/upload`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => 'Upload failed');
        throw new Error(`Upload error ${res.status}: ${text}`);
    }

    return res.json();
}
