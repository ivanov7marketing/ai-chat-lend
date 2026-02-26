import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogIn, Eye, EyeOff } from 'lucide-react'

type LoginMode = 'tenant' | 'superadmin'

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, loginAsSuperAdmin } = useAuth()

    const [mode, setMode] = useState<LoginMode>('tenant')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (mode === 'tenant') {
                const { slug } = await login(email, password)
                navigate(from || `/${slug}/admin`, { replace: true })
            } else {
                await loginAsSuperAdmin(email, password)
                navigate(from || '/admin', { replace: true })
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка входа'
            if (message.includes('401') || message.includes('403')) {
                setError('Неверный email или пароль')
            } else {
                setError(message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">
                        AI Max<span className="text-primary-500">.</span>
                    </Link>
                    <p className="text-sm text-gray-500 mt-2">Войдите в панель управления</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    {/* Mode toggle */}
                    <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setMode('tenant')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'tenant'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Компания
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('superadmin')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'superadmin'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Администратор
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.ru"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Пароль
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                                    ) : (
                                        <Eye className="w-5 h-5" strokeWidth={1.5} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white w-5 h-5" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" strokeWidth={1.5} />
                                    Войти
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Register link */}
                {mode === 'tenant' && (
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Нет аккаунта?{' '}
                        <Link to="/register" className="text-primary-500 font-medium hover:text-primary-600 transition-colors duration-200">
                            Зарегистрироваться
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}
