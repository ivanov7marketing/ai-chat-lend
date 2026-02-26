import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getTenants } from '../../services/superAdminApi'
import type { TenantListItem, TenantFilters } from '../../types/auth'
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const PLAN_BADGE: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    pro: 'bg-primary-50 text-primary-600',
    enterprise: 'bg-amber-50 text-amber-700',
}

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
    })
}

export default function TenantsList() {
    const [tenants, setTenants] = useState<TenantListItem[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(0)
    const pageSize = 20
    const [filters, setFilters] = useState<TenantFilters>({
        search: '',
        plan: 'all',
        status: 'all',
    })

    const load = useCallback(async () => {
        setIsLoading(true)
        const res = await getTenants(filters, pageSize, page * pageSize)
        setTenants(res.data)
        setTotal(res.total)
        setIsLoading(false)
    }, [filters, page])

    useEffect(() => {
        load()
    }, [load])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Тенанты</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Все зарегистрированные компании на платформе
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    <input
                        value={filters.search}
                        onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(0) }}
                        placeholder="Поиск по названию или email..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                    />
                </div>

                {/* Plan filter */}
                <select
                    value={filters.plan}
                    onChange={(e) => { setFilters((f) => ({ ...f, plan: e.target.value as TenantFilters['plan'] })); setPage(0) }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                >
                    <option value="all">Все тарифы</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>

                {/* Status filter */}
                <select
                    value={filters.status}
                    onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value as TenantFilters['status'] })); setPage(0) }}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                >
                    <option value="all">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="blocked">Заблокированные</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3">Компания</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Тариф</th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3 text-right">Сессий</th>
                            <th className="px-4 py-3 text-right">Лидов</th>
                            <th className="px-4 py-3">Регистрация</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3.5">
                                            <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : tenants.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                    Тенанты не найдены
                                </td>
                            </tr>
                        ) : (
                            tenants.map((t) => (
                                <tr
                                    key={t.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-4 py-3.5">
                                        <div>
                                            <p className="font-medium text-gray-900">{t.companyName}</p>
                                            <p className="text-xs text-gray-400">/{t.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-700">{t.email}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${PLAN_BADGE[t.plan] || PLAN_BADGE.free}`}>
                                            {PLAN_LABEL[t.plan] || t.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {t.isActive ? 'Активен' : 'Заблокирован'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-gray-700">
                                        {t.sessionsThisMonth}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-gray-700">
                                        {t.leadsThisMonth}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-700">
                                        {formatDate(t.createdAt)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <Link
                                            to={`/admin/tenants/${t.id}`}
                                            className="text-primary-500 hover:text-primary-600 transition-colors duration-200"
                                        >
                                            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {total > pageSize && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} из {total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <span className="text-xs text-gray-500 px-2">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page + 1 >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
