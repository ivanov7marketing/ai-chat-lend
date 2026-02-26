import React, { createContext, useState, useEffect, useCallback, useRef } from 'react'
import type { AuthUser, AuthResponse, RegisterInput } from '../types/auth'
import {
    loginTenant as apiLoginTenant,
    loginSuperAdmin as apiLoginSuperAdmin,
    registerTenant as apiRegisterTenant,
    refreshTokens as apiRefreshTokens,
} from '../services/authApi'

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<{ slug: string }>
    loginAsSuperAdmin: (email: string, password: string) => Promise<void>
    register: (data: RegisterInput) => Promise<{ slug: string }>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Decode JWT payload without verifying signature (client-side only).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const base64 = token.split('.')[1]
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(json)
    } catch {
        return null
    }
}

function buildUserFromToken(token: string, extra?: Partial<AuthUser>): AuthUser | null {
    const payload = decodeJwtPayload(token)
    if (!payload) return null

    return {
        id: (payload.userId as string) || '',
        email: (payload.email as string) || extra?.email || '',
        type: (payload.type as AuthUser['type']) || 'tenant_owner',
        tenantId: (payload.tenantId as string) || extra?.tenantId,
        slug: extra?.slug,
        companyName: extra?.companyName,
        role: (payload.role as string) || undefined,
        ...extra,
    }
}

function storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('auth_refresh_token', refreshToken)
}

function clearTokens() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_slug')
    localStorage.removeItem('auth_company')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Auto-refresh every 14 minutes (access token expires in 15 min)
    const startRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = setInterval(async () => {
            const rt = localStorage.getItem('auth_refresh_token')
            if (!rt) return
            try {
                const tokens = await apiRefreshTokens(rt)
                storeTokens(tokens.accessToken, tokens.refreshToken)
            } catch {
                // Refresh failed — session expired
                clearTokens()
                setUser(null)
            }
        }, 14 * 60 * 1000)
    }, [])

    // On mount: restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            const slug = localStorage.getItem('auth_slug') || undefined
            const companyName = localStorage.getItem('auth_company') || undefined
            const restored = buildUserFromToken(token, { slug, companyName })
            if (restored) {
                setUser(restored)
                startRefreshTimer()
            }
        }
        setIsLoading(false)
    }, [startRefreshTimer])

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
        }
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        const res: AuthResponse & { slug?: string; companyName?: string } =
            await apiLoginTenant(email, password)
        storeTokens(res.accessToken, res.refreshToken)
        if (res.slug) localStorage.setItem('auth_slug', res.slug)
        if (res.companyName) localStorage.setItem('auth_company', res.companyName)
        const u = buildUserFromToken(res.accessToken, {
            slug: res.slug,
            companyName: res.companyName,
            tenantId: res.tenantId,
        })
        setUser(u)
        startRefreshTimer()
        return { slug: res.slug || '' }
    }, [startRefreshTimer])

    const loginAsSuperAdmin = useCallback(async (email: string, password: string) => {
        const res = await apiLoginSuperAdmin(email, password)
        storeTokens(res.accessToken, res.refreshToken)
        const u = buildUserFromToken(res.accessToken)
        setUser(u)
        startRefreshTimer()
    }, [startRefreshTimer])

    const register = useCallback(async (data: RegisterInput) => {
        const res = await apiRegisterTenant(data)
        storeTokens(res.accessToken, res.refreshToken)
        if (res.slug) localStorage.setItem('auth_slug', res.slug)
        const u = buildUserFromToken(res.accessToken, {
            slug: res.slug,
            companyName: data.companyName,
            tenantId: res.tenantId,
        })
        setUser(u)
        startRefreshTimer()
        return { slug: res.slug || data.slug }
    }, [startRefreshTimer])

    const logout = useCallback(() => {
        clearTokens()
        setUser(null)
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                loginAsSuperAdmin,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext }
