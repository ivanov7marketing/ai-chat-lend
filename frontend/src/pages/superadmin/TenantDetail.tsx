import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTenantDetail, blockTenant, unblockTenant, updateTenant } from '../../services/superAdminApi'
import type { TenantDetailData } from '../../types/auth'
import {
    ArrowLeft,
    Building2,
    Mail,
    MapPin,
    Calendar,
    Shield,
    ShieldOff,
    Activity,
    MessageSquare,
    Target,
    FileText,
    HardDrive,
} from 'lucide-react'

const PLAN_LABEL: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Б'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function TenantDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [tenant, setTenant] = useState<TenantDetailData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (!id) return
        getTenantDetail(id)
            .then(setTenant)
            .finally(() => setIsLoading(false))
    }, [id])

    async function handleToggleBlock() {
        if (!tenant || !id) return
        setActionLoading(true)
        try {
            if (tenant.isActive) {
                await blockTenant(id)
                setTenant((t) => t ? { ...t, isActive: false } : null)
            } else {
                await unblockTenant(id)
                setTenant((t) => t ? { ...t, isActive: true } : null)
            }
        } catch (e) {
            console.error('Error toggling tenant status:', e)
        } finally {
            setActionLoading(false)
        }
    }

    async function handleChangePlan(newPlan: string) {
        if (!id) return
        setActionLoading(true)
        try {
            await updateTenant(id, { plan: newPlan })
            setTenant((t) => t ? { ...t, plan: newPlan as TenantDetailData['plan'] } : null)
        } catch (e) {
            console.error('Error changing plan:', e)
        } finally {
            setActionLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="bg-gray-200 rounded-xl h-8 w-48" />
                    <div className="bg-gray-200 rounded-2xl h-64" />
                    <div className="bg-gray-200 rounded-2xl h-48" />
                </div>
            </div>
        )
    }

    if (!tenant) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Тенант не найден</p>
                <button
                    onClick={() => navigate('/admin/tenants')}
                    className="text-primary-500 text-sm hover:underline"
                >
                    Вернуться к списку
                </button>
            </div>
        )
    }

    const usageItems = [
        { icon: Activity, label: 'Сессий', value: tenant.usage.sessionsCount },
        { icon: MessageSquare, label: 'Сообщений', value: tenant.usage.messagesCount },
        { icon: Target, label: 'Лидов', value: tenant.usage.leadsCount },
        { icon: FileText, label: 'PDF', value: tenant.usage.pdfGenerated },
        { icon: HardDrive, label: 'Хранилище', value: formatBytes(tenant.usage.storageBytes) },
    ]

    return (
        <div className="p-8 max-w-4xl">
            {/* Back */}
            <Link
                to="/admin/tenants"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 mb-6"
            >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Список тенантов
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {tenant.companyName}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">/{tenant.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tenant.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}>
                        {tenant.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                        {PLAN_LABEL[tenant.plan] || tenant.plan}
                    </span>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Информация</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <div>
                            <p className="text-xs text-gray-400">Компания</p>
                            <p className="text-sm text-gray-900">{tenant.companyName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-sm text-gray-900">{tenant.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <div>
                            <p className="text-xs text-gray-400">Город</p>
                            <p className="text-sm text-gray-900">{tenant.city}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <div>
                            <p className="text-xs text-gray-400">Регистрация</p>
                            <p className="text-sm text-gray-900">{formatDate(tenant.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Использование за месяц</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {usageItems.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="text-center">
                            <Icon className="w-5 h-5 text-gray-400 mx-auto mb-1" strokeWidth={1.5} />
                            <p className="text-lg font-semibold text-gray-900">
                                {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
                            </p>
                            <p className="text-xs text-gray-400">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Действия</h2>
                <div className="flex flex-wrap gap-3">
                    {/* Change plan */}
                    <select
                        value={tenant.plan}
                        onChange={(e) => handleChangePlan(e.target.value)}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 disabled:opacity-50"
                    >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>

                    {/* Block / Unblock */}
                    <button
                        onClick={handleToggleBlock}
                        disabled={actionLoading}
                        className={`inline-flex items-center justify-center px-6 py-2.5 font-medium rounded-full shadow-sm transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${tenant.isActive
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                    >
                        {tenant.isActive ? (
                            <>
                                <ShieldOff className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                                Заблокировать
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                                Разблокировать
                            </>
                        )}
                    </button>

                    {/* Visit tenant landing */}
                    <a
                        href={`/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm transition-all duration-200 text-sm hover:bg-gray-50 hover:border-gray-300"
                    >
                        Посмотреть лендинг
                    </a>
                </div>
            </div>
        </div>
    )
}
