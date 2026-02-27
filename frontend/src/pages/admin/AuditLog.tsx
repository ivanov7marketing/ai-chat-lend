import { useEffect, useState } from 'react';
import { Shield, Clock, Info, AlertCircle, FileText } from 'lucide-react';

interface AuditEntry {
    id: string;
    event_type: string;
    description: string;
    user_name: string;
    created_at: string;
    metadata: any;
}

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

export default function AuditLog() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const slug = localStorage.getItem('auth_slug');
        const token = localStorage.getItem('auth_token');
        if (!slug) return;

        fetch(`${API_BASE}/api/t/${slug}/admin/audit`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(setLogs)
            .finally(() => setLoading(false));
    }, []);

    const getIcon = (type: string) => {
        if (type.includes('error')) return <AlertCircle className="text-red-500" size={18} />;
        if (type.includes('security')) return <Shield className="text-amber-500" size={18} />;
        if (type.includes('settings')) return <Info className="text-blue-500" size={18} />;
        return <FileText className="text-gray-400" size={18} />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
                    <Shield size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Журнал действий</h1>
                    <p className="text-sm text-gray-500">История изменений и системных событий вашего бота</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Дата</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Событие</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Описание</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Оператор</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td colSpan={4} className="px-6 py-8">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length > 0 ? (
                                logs.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock size={14} />
                                                {new Date(entry.created_at).toLocaleString('ru-RU')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getIcon(entry.event_type)}
                                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                    {entry.event_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700">{entry.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {entry.user_name || 'Система'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        Записей не найдено
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
