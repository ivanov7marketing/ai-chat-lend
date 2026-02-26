import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

interface DialogSession {
    id: string;
    created_at: string;
    status: string;
    utm_source: string | null;
    contact_type: string | null;
    phone: string | null;
    estimate_max: number | null;
}

export default function DialogsList() {
    const [dialogs, setDialogs] = useState<DialogSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDialogs = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/dialogs`);
                if (res.ok) {
                    const data = await res.json();
                    setDialogs(data.data || []);
                } else {
                    console.error("API error fetching dialogs:", await res.text());
                }
            } catch (err) {
                console.error("Failed to fetch dialogs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDialogs();
    }, []);

    if (loading) return <div className="p-8 text-gray-500">Загрузка...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Диалоги и Лиды</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                            <th className="p-4 font-normal">ID Сессии</th>
                            <th className="p-4 font-normal">Статус</th>
                            <th className="p-4 font-normal">Контакты (Лид)</th>
                            <th className="p-4 font-normal">Оценка (max)</th>
                            <th className="p-4 font-normal">Дата</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {dialogs.map(d => (
                            <tr key={d.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 text-gray-600">
                                    <Link to={`/admin/dialogs/${d.id}`} className="hover:underline text-blue-600 font-medium">
                                        {d.id.slice(0, 8)}...
                                    </Link>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {d.status === 'converted' ? 'Лид' : 'Активен'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {d.phone ? (
                                        <div>
                                            <div className="font-medium text-gray-900">{d.phone}</div>
                                            <div className="text-xs text-gray-400 capitalize">{d.contact_type}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-600">
                                    {d.estimate_max ? `${d.estimate_max.toLocaleString('ru')} ₽` : '—'}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(d.created_at).toLocaleString('ru-RU', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {dialogs.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Нет записанных диалогов.</div>
                )}
            </div>
        </div>
    );
}
