import React, { createContext, useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { TenantConfig } from '../types/auth'
import { getTenantConfig } from '../services/authApi'

interface TenantContextValue extends TenantConfig {
    isLoading: boolean
    error: string | null
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { slug } = useParams<{ slug: string }>()
    const [config, setConfig] = useState<TenantConfig | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!slug) {
            setError('Slug не указан')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        getTenantConfig(slug)
            .then((data) => {
                setConfig(data)
                setIsLoading(false)
            })
            .catch(() => {
                setError('Компания не найдена')
                setIsLoading(false)
            })
    }, [slug])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 w-8 h-8 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Загрузка...</p>
                </div>
            </div>
        )
    }

    if (error || !config) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">😕</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Страница не найдена
                    </h1>
                    <p className="text-gray-500 mb-6">
                        {error || 'Компания с таким адресом не зарегистрирована на платформе.'}
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5"
                    >
                        На главную
                    </a>
                </div>
            </div>
        )
    }

    return (
        <TenantContext.Provider value={{ ...config, isLoading, error }}>
            {children}
        </TenantContext.Provider>
    )
}

export function useTenant(): TenantConfig {
    const ctx = useContext(TenantContext)
    if (!ctx) throw new Error('useTenant must be used within TenantProvider')
    return ctx
}

export { TenantContext }
