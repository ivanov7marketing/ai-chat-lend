import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDialogDetail, updateDialogRating } from '../../services/adminApi';
import type { DialogDetailData, DialogRating } from '../../types/admin';
import { ArrowLeft, User, Bot, Headset, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const RATINGS: { key: DialogRating; icon: typeof CheckCircle; label: string; emoji: string; color: string }[] = [
    { key: 'good', icon: CheckCircle, label: 'Качественный', emoji: '✅', color: 'text-green-600 hover:bg-green-50' },
    { key: 'bad', icon: XCircle, label: 'Нецелевой', emoji: '❌', color: 'text-red-500 hover:bg-red-50' },
    { key: 'needs_improvement', icon: AlertTriangle, label: 'Доработать бота', emoji: '⚠️', color: 'text-amber-500 hover:bg-amber-50' },
    { key: 'repeat', icon: RefreshCw, label: 'Повторный', emoji: '🔄', color: 'text-secondary-500 hover:bg-secondary-50' },
];

export default function DialogDetail() {
    const { id } = useParams();
    const [data, setData] = useState<DialogDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeRating, setActiveRating] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getDialogDetail(id)
            .then((res) => {
                setData(res);
                setActiveRating(res?.lead?.manual_rating || null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleRating = async (rating: DialogRating) => {
        if (!id) return;
        setActiveRating(rating);
        await updateDialogRating(id, rating);
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="bg-gray-200 rounded-xl h-8 w-48" />
                    <div className="bg-gray-200 rounded-2xl h-96" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 font-medium mb-2">Диалог не найден</div>
                <Link to="/admin/dialogs" className="text-primary-600 hover:text-primary-700 text-sm">
                    ← Вернуться к списку
                </Link>
            </div>
        );
    }

    const roleConfig = {
        bot: { align: 'justify-start', bubble: 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm', icon: Bot, iconBg: 'bg-primary-50 text-primary-600', time: 'text-gray-400' },
        user: { align: 'justify-end', bubble: 'bg-primary-500 text-white rounded-br-sm', icon: User, iconBg: 'bg-gray-100 text-gray-600', time: 'text-primary-200' },
        manager: { align: 'justify-start', bubble: 'bg-secondary-500 text-white rounded-bl-sm', icon: Headset, iconBg: 'bg-secondary-50 text-secondary-600', time: 'text-secondary-200' },
    };

    return (
        <div className="p-8 max-w-6xl mx-auto flex gap-6 items-start min-h-[calc(100vh-2rem)]">
            {/* Chat History */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4 bg-white">
                    <Link
                        to="/admin/dialogs"
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Назад
                    </Link>
                    <div className="h-4 w-px bg-gray-200" />
                    <div>
                        <h2 className="font-semibold text-gray-900 text-sm">История диалога</h2>
                        <div className="text-[10px] text-gray-400 font-mono">{id}</div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
                    {data.messages.length === 0 ? (
                        <div className="text-center text-gray-400 h-full flex items-center justify-center">
                            В сессии нет сообщений
                        </div>
                    ) : (
                        data.messages.map((m) => {
                            const role = m.role as 'bot' | 'user' | 'manager';
                            const cfg = roleConfig[role] || roleConfig.bot;
                            const Icon = cfg.icon;
                            return (
                                <div key={m.id} className={`flex ${cfg.align} gap-2`}>
                                    {role !== 'user' && (
                                        <div className={`w-7 h-7 rounded-full ${cfg.iconBg} flex items-center justify-center shrink-0 mt-1`}>
                                            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${cfg.bubble}`}>
                                        {role === 'manager' && (
                                            <div className="text-xs font-medium mb-1 opacity-80">Менеджер</div>
                                        )}
                                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                                        <div className={`text-[10px] mt-1.5 text-right ${cfg.time}`}>
                                            {new Date(m.created_at).toLocaleTimeString('ru-RU', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Sidebar Meta */}
            <div className="w-80 shrink-0 space-y-4 sticky top-8">
                {/* Session Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 text-sm">Данные сессии</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <div className="text-gray-400 text-xs mb-0.5">Статус</div>
                            <div className="font-medium">
                                {data.session.status === 'converted' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">✅ Лид</span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{data.session.status}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-xs mb-0.5">Дата</div>
                            <div className="text-gray-700">
                                {new Date(data.session.created_at).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                        {data.session.utm_source && (
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">UTM Источник</div>
                                <div className="text-gray-700">{data.session.utm_source}</div>
                            </div>
                        )}
                        {data.session.device && (
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Устройство</div>
                                <div className="text-gray-700">{data.session.device}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-gray-400 text-xs mb-0.5">Сообщений</div>
                            <div className="text-gray-700">{data.messages.length}</div>
                        </div>
                    </div>
                </div>

                {/* Lead Info */}
                {data.lead && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Лид</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-gray-400 text-xs mb-0.5">Контакт</div>
                                <div className="font-medium text-gray-900">{data.lead.contact_value}</div>
                                <div className="text-gray-400 text-xs capitalize">{data.lead.contact_type}</div>
                            </div>
                            {data.lead.apartment_params && (
                                <div>
                                    <div className="text-gray-400 text-xs mb-1">Параметры</div>
                                    {Object.entries(data.lead.apartment_params).map(([k, v]) => (
                                        <div key={k} className="flex justify-between py-0.5">
                                            <span className="text-gray-500 capitalize">{k}</span>
                                            <span className="font-medium text-gray-900">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-gray-400 text-xs mb-0.5">Ориентировочная смета</div>
                                <div className="font-medium text-gray-900">
                                    {data.lead.estimate_min?.toLocaleString('ru')} – {data.lead.estimate_max?.toLocaleString('ru')} ₽
                                </div>
                                {data.lead.selected_segment && (
                                    <div className="text-xs text-gray-500 mt-0.5">Сегмент: {data.lead.selected_segment}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Оценка диалога</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {RATINGS.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => handleRating(r.key)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${activeRating === r.key
                                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                                        : `border-gray-200 text-gray-600 ${r.color}`
                                    }`}
                            >
                                <span>{r.emoji}</span>
                                <span className="text-xs">{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Connect Button (placeholder) */}
                <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 text-gray-400 font-medium rounded-xl text-sm cursor-not-allowed"
                    title="Функция подключения менеджера в разработке"
                >
                    <Headset className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
                    Подключиться к чату
                </button>
            </div>
        </div>
    );
}
