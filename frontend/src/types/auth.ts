// ============ Auth Types ============

export type UserType = 'tenant_owner' | 'tenant_user' | 'superadmin'

export interface AuthUser {
    id: string
    email: string
    name?: string
    type: UserType
    tenantId?: string
    slug?: string
    companyName?: string
    role?: string
}

export interface AuthResponse {
    success: boolean
    accessToken: string
    refreshToken: string
    tenantId?: string
    slug?: string
    companyName?: string
}

export interface RegisterInput {
    slug: string
    companyName: string
    email: string
    password: string
    phone?: string
    city?: string
}

export interface SlugCheckResponse {
    available: boolean
    slug: string
}

// ============ Tenant Config (from GET /api/t/:slug/config) ============

export interface TenantBranding {
    primaryColor: string
    secondaryColor: string
    pageTitle: string
    pageSubtitle: string
    heroImageUrl: string | null
    companyDescription: string
    footerText: string
    faviconUrl: string | null
    metaDescription: string
}

export interface TenantBotConfig {
    name: string
    avatarUrl: string | null
    tone: 'professional' | 'friendly' | 'neutral'
    language: 'ru' | 'en'
    welcomeMessage: string
    quickButtons: TenantQuickButton[]
}

export interface TenantQuickButton {
    id?: string
    text: string
    emoji: string
    action: 'start_funnel' | 'ask_kb' | 'custom'
}

export interface TenantSegment {
    name: string
    description: string
    priceRangeMin: number
    priceRangeMax: number
}

export interface TenantConfig {
    slug: string
    companyName: string
    city: string
    logoUrl: string | null
    branding: TenantBranding
    bot: TenantBotConfig
    segments: TenantSegment[]
    behavior: {
        estimateDisclaimer: string
    }
    integrations?: {
        yandexMetrika?: {
            counterId: string
        }
    }
}

// ============ SuperAdmin Types ============

export interface PlatformMetrics {
    totalTenants: number
    activeTenants: number
    newTenants: number
    totalSessions: number
    totalLeads: number
    mrr: number
}

export interface TenantListItem {
    id: string
    slug: string
    companyName: string
    email: string
    plan: 'free' | 'pro' | 'enterprise'
    isActive: boolean
    isVerified: boolean
    sessionsThisMonth: number
    leadsThisMonth: number
    createdAt: string
    lastLoginAt: string | null
}

export interface TenantDetailData {
    id: string
    slug: string
    companyName: string
    email: string
    phone: string | null
    city: string
    plan: 'free' | 'pro' | 'enterprise'
    isActive: boolean
    isVerified: boolean
    logoUrl: string | null
    createdAt: string
    lastLoginAt: string | null
    trialEndsAt: string | null
    usage: {
        sessionsCount: number
        messagesCount: number
        leadsCount: number
        tokensUsed: number
        pdfGenerated: number
        storageBytes: number
    }
}

export interface TenantFilters {
    search: string
    plan: 'all' | 'free' | 'pro' | 'enterprise'
    status: 'all' | 'active' | 'blocked'
}

export interface AuditLogEntry {
    id: number
    actorType: string
    actorId: string | null
    tenantId: string | null
    action: string
    details: Record<string, unknown> | null
    ipAddress: string | null
    createdAt: string
}
