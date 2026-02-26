import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

interface DetailData {
    session: any;
    lead: any;
    messages: { id: string; role: string; content: string; created_at: string }[];
}

export default function DialogDetail() {
    const { id } = useParams();
    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/dialog/${id}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch detail", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="p-8 text-gray-500">Загрузка...</div>;
    if (!data) return <div className="p-8 text-red-500">Диалог не найден</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto flex gap-6 items-start h-full pb-20">
            {/* Chat History Column */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
                    <Link to="/admin/dialogs" className="text-gray-400 hover:text-gray-900 transition-colors">
                        ← Назад
                    </Link>
                    <div>
                        <h2 className="font-semibold text-gray-900">История диалога</h2>
                        <div className="text-xs text-gray-500 font-mono">{id}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {data.messages.map(m => {
                        const isUser = m.role === 'user';
                        return (
                            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl p-4 whitespace-pre-wrap ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border text-gray-800 rounded-bl-sm shadow-sm'
                                    }`}>
                                    <div className="text-sm">{m.content}</div>
                                    <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {data.messages.length === 0 && (
                        <div className="text-center text-gray-400 h-full flex items-center justify-center">В сессии нет сообщений</div>
                    )}
                </div>
            </div>

            {/* Meta Profile Column */}
            <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 shrink-0 sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4">Данные сессии</h3>

                <div className="space-y-4 text-sm">
                    <div>
                        <div className="text-gray-500 mb-1">Статус</div>
                        <div className="font-medium">
                            {data.session.status === 'converted' ? (
                                <span className="text-green-600">✅ Конвертирован в лид</span>
                            ) : (
                                <span className="text-gray-600">Активен (нет лида)</span>
                            )}
                        </div>
                    </div>

                    {data.lead && (
                        <>
                            <div className="pt-4 border-t">
                                <div className="text-gray-500 mb-1">Контакты</div>
                                <div className="font-medium text-gray-900">{data.lead.contact_value}</div>
                                <div className="text-gray-500 text-xs capitalize">Связь: {data.lead.contact_type}</div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="text-gray-500 mb-1">Параметры квартиры</div>
                                {data.lead.apartment_params && Object.entries(data.lead.apartment_params).map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-1">
                                        <span className="text-gray-500 capitalize">{k}</span>
                                        <span className="font-medium text-gray-900 text-right">{String(v)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="text-gray-500 mb-1">Ориентировочная смета</div>
                                <div className="font-medium text-gray-900">
                                    {data.lead.estimate_min?.toLocaleString('ru')} – {data.lead.estimate_max?.toLocaleString('ru')} ₽
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                    Выбран: {data.lead.selected_segment}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
