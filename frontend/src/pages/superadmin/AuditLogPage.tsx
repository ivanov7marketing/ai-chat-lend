import { useEffect, useState } from 'react'
import { getAuditLog } from '../../services/superAdminApi'
import type { AuditLogEntry } from '../../types/auth'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(0)
    const pageSize = 50

    useEffect(() => {
        setIsLoading(true)
        getAuditLog(pageSize, page * pageSize)
            .then((res) => {
                setEntries(res.data)
                setTotal(res.total)
            })
            .finally(() => setIsLoading(false))
    }, [page])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    Аудит-лог
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    История действий на платформе
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3">Дата</th>
                            <th className="px-4 py-3">Актор</th>
                            <th className="px-4 py-3">Действие</th>
                            <th className="px-4 py-3">Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3.5">
                                            <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                    Нет записей
                                </td>
                            </tr>
                        ) : (
                            entries.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                                        {formatDate(e.createdAt)}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {e.actorType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-900 font-medium">
                                        {e.action}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-500 text-xs max-w-xs truncate">
                                        {e.details ? JSON.stringify(e.details) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

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
