import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDialogs } from '../../services/adminApi';
import type { DialogSession, DialogFilters } from '../../types/admin';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
    { key: 'all', label: 'Все' },
    { key: 'converted', label: 'Лиды' },
    { key: 'active', label: 'Активные' },
    { key: 'closed', label: 'Закрытые' },
] as const;

const DATE_PRESETS = [
    { key: 'today', label: 'Сегодня' },
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'all', label: 'Все' },
] as const;

const RATING_ICONS: Record<string, string> = {
    good: '✅',
    bad: '❌',
    needs_improvement: '⚠️',
    repeat: '🔄',
};

const PAGE_SIZE = 20;

export default function DialogsList() {
    const [dialogs, setDialogs] = useState<DialogSession[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<DialogFilters>({
        dateRange: 'all',
        status: 'all',
        search: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getDialogs(filters, PAGE_SIZE, page * PAGE_SIZE);
            setDialogs(res.data);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to fetch dialogs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, filters]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const statusBadge = (status: string) => {
        if (status === 'converted')
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Лид</span>;
        if (status === 'active')
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">В процессе</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Закрыт</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Диалоги</h1>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date preset */}
                    <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
                        {DATE_PRESETS.map((d) => (
                            <button
                                key={d.key}
                                onClick={() => setFilters((f) => ({ ...f, dateRange: d.key }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filters.dateRange === d.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => { setFilters((f) => ({ ...f, status: s.key as DialogFilters['status'] })); setPage(0); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filters.status === s.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(0); }}
                                placeholder="Поиск по ID, телефону, UTM..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-3">Дата</th>
                                <th className="px-4 py-3">Источник</th>
                                <th className="px-4 py-3">Статус</th>
                                <th className="px-4 py-3">Контакт</th>
                                <th className="px-4 py-3">Вилка (макс.)</th>
                                <th className="px-4 py-3">Оценка</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3.5">
                                                <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-20" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : dialogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        Нет диалогов по выбранным фильтрам.
                                    </td>
                                </tr>
                            ) : (
                                dialogs.map((d) => (
                                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                                            {new Date(d.created_at).toLocaleString('ru-RU', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500">
                                            {d.utm_source || <span className="text-gray-300">Прямой</span>}
                                        </td>
                                        <td className="px-4 py-3.5">{statusBadge(d.status)}</td>
                                        <td className="px-4 py-3.5">
                                            {d.phone ? (
                                                <div>
                                                    <div className="font-medium text-gray-900">{d.phone}</div>
                                                    <div className="text-xs text-gray-400 capitalize">{d.contact_type}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-700">
                                            {d.estimate_max ? `${d.estimate_max.toLocaleString('ru')} ₽` : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-lg">
                                            {d.manual_rating ? RATING_ICONS[d.manual_rating] || '' : ''}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Link
                                                to={`/admin/dialogs/${d.id}`}
                                                className="text-primary-600 hover:text-primary-700 font-medium text-xs transition-colors"
                                            >
                                                Открыть →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && total > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                        <span className="text-sm text-gray-500">
                            Показано {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} из {total}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all duration-200"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" strokeWidth={1.5} />
                                Назад
                            </button>
                            <span className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all duration-200"
                            >
                                Далее
                                <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
