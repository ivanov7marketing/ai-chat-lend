import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { checkSlug } from '../../services/authApi'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register } = useAuth()

    const [form, setForm] = useState({
        companyName: '',
        slug: '',
        email: '',
        password: '',
        city: 'Челябинск',
    })
    const [agree, setAgree] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Slug availability
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [slugSuggestion, setSlugSuggestion] = useState('')

    // Auto-generate slug from company name
    useEffect(() => {
        if (!form.companyName) {
            setForm((f) => ({ ...f, slug: '' }))
            return
        }
        const generated = form.companyName
            .toLowerCase()
            .replace(/[а-яё]/gi, (c) => {
                const map: Record<string, string> = {
                    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
                }
                return map[c.toLowerCase()] || c
            })
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50)
        setForm((f) => ({ ...f, slug: generated }))
    }, [form.companyName])

    // Debounced slug check
    const checkSlugAvailability = useCallback(async (slug: string) => {
        if (slug.length < 3) {
            setSlugStatus('idle')
            return
        }
        setSlugStatus('checking')
        try {
            const res = await checkSlug(slug)
            setSlugSuggestion(res.slug)
            setSlugStatus(res.available ? 'available' : 'taken')
        } catch {
            setSlugStatus('idle')
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.slug) checkSlugAvailability(form.slug)
        }, 500)
        return () => clearTimeout(timer)
    }, [form.slug, checkSlugAvailability])

    function updateField(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }))
        setError('')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        // Client-side validation
        if (form.slug.length < 3) {
            setError('URL-адрес должен содержать минимум 3 символа')
            return
        }
        if (form.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов')
            return
        }
        if (!agree) {
            setError('Необходимо принять условия использования')
            return
        }
        if (slugStatus === 'taken') {
            setError('Этот URL-адрес уже занят')
            return
        }

        setLoading(true)
        try {
            const { slug } = await register({
                slug: form.slug,
                companyName: form.companyName,
                email: form.email,
                password: form.password,
                city: form.city,
            })
            navigate(`/${slug}/admin`, { replace: true })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка регистрации'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">
                        AI Max<span className="text-primary-500">.</span>
                    </Link>
                    <p className="text-sm text-gray-500 mt-2">
                        Создайте AI-бота для вашей компании
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Название компании
                            </label>
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={(e) => updateField('companyName', e.target.value)}
                                placeholder="ООО «РемонтПро»"
                                required
                                minLength={3}
                                maxLength={255}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                URL-адрес вашей страницы
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 whitespace-nowrap">
                                    ai-chat-lend.ru/
                                </span>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) =>
                                            updateField(
                                                'slug',
                                                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                            )
                                        }
                                        placeholder="remontpro"
                                        required
                                        minLength={3}
                                        maxLength={50}
                                        className={`w-full px-4 py-3 pr-10 bg-white border rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:ring-4 ${slugStatus === 'available'
                                                ? 'border-green-400 focus:border-green-500 focus:ring-green-50'
                                                : slugStatus === 'taken'
                                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-50'
                                                    : 'border-gray-200 focus:border-primary-500 focus:ring-primary-50'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {slugStatus === 'checking' && (
                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" strokeWidth={2} />
                                        )}
                                        {slugStatus === 'available' && (
                                            <Check className="w-4 h-4 text-green-500" strokeWidth={2} />
                                        )}
                                        {slugStatus === 'taken' && (
                                            <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                                        )}
                                    </div>
                                </div>
                            </div>
                            {slugStatus === 'taken' && slugSuggestion && (
                                <p className="mt-1 text-xs text-red-500">
                                    Этот адрес занят. Попробуйте: <strong>{slugSuggestion}</strong>
                                </p>
                            )}
                            {slugStatus === 'available' && (
                                <p className="mt-1 text-xs text-green-600">Адрес свободен ✓</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                placeholder="admin@company.ru"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Пароль
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                placeholder="Минимум 8 символов"
                                required
                                minLength={8}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Город
                            </label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={(e) => updateField('city', e.target.value)}
                                placeholder="Челябинск"
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>

                        {/* Agreement */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-600">
                                Принимаю{' '}
                                <a href="/terms" className="text-primary-500 hover:underline">
                                    условия использования
                                </a>
                            </span>
                        </label>

                        {/* Error */}
                        {error && <p className="text-sm text-red-500">{error}</p>}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || slugStatus === 'taken'}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white w-5 h-5" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" strokeWidth={1.5} />
                                    Зарегистрироваться
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Уже есть аккаунт?{' '}
                    <Link
                        to="/login"
                        className="text-primary-500 font-medium hover:text-primary-600 transition-colors duration-200"
                    >
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    )
}
