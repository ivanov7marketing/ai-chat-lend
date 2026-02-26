import { useEffect, useState } from 'react'
import { getDashboard } from '../../services/superAdminApi'
import type { PlatformMetrics } from '../../types/auth'
import { Users, UserCheck, Activity, Target, TrendingUp } from 'lucide-react'

const METRIC_CARDS = [
    { key: 'totalTenants' as const, label: 'Всего тенантов', icon: Users, color: 'bg-primary-50 text-primary-600' },
    { key: 'activeTenants' as const, label: 'Активных', icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { key: 'newTenants' as const, label: 'Новых за месяц', icon: TrendingUp, color: 'bg-secondary-50 text-secondary-500' },
    { key: 'totalSessions' as const, label: 'Сессий (платформа)', icon: Activity, color: 'bg-amber-50 text-amber-600' },
    { key: 'totalLeads' as const, label: 'Лидов (платформа)', icon: Target, color: 'bg-purple-50 text-purple-600' },
]

export default function SuperDashboard() {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getDashboard()
            .then(setMetrics)
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    Дашборд платформы
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Общая статистика по всем тенантам
                </p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {METRIC_CARDS.map(({ key, label, icon: Icon, color }) => (
                    <div
                        key={key}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {label}
                        </p>
                        {isLoading ? (
                            <div className="animate-pulse bg-gray-200 rounded-xl h-8 w-20" />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">
                                {metrics ? metrics[key].toLocaleString('ru-RU') : '—'}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* MRR card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    MRR (Monthly Recurring Revenue)
                </p>
                {isLoading ? (
                    <div className="animate-pulse bg-gray-200 rounded-xl h-8 w-32" />
                ) : (
                    <p className="text-3xl font-bold text-gray-900">
                        {metrics ? metrics.mrr.toLocaleString('ru-RU') : 0}{' '}
                        <span className="text-lg font-normal text-gray-400">₽</span>
                    </p>
                )}
            </div>
        </div>
    )
}
