import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/adminApi';
import type { DashboardMetrics } from '../../types/admin';
import {
    Eye,
    MessageSquare,
    ClipboardList,
    CheckCircle2,
    UserCheck,
    TrendingUp,
    Clock,
} from 'lucide-react';

const PERIOD_OPTIONS = [
    { key: 'today', label: 'Сегодня' },
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'all', label: 'Всё время' },
] as const;

const METRIC_CARDS = [
    { key: 'totalVisits', label: 'Визиты', icon: Eye, color: 'text-gray-500', bg: 'bg-gray-100' },
    { key: 'chatOpened', label: 'Открыт чат', icon: MessageSquare, color: 'text-secondary-500', bg: 'bg-secondary-50' },
    { key: 'estimateStarted', label: 'Начата воронка', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'estimateCompleted', label: 'Завершена воронка', icon: CheckCircle2, color: 'text-primary-500', bg: 'bg-primary-50' },
    { key: 'leadsCreated', label: 'Собрано лидов', icon: UserCheck, color: 'text-primary-600', bg: 'bg-primary-100' },
] as const;

export default function Dashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [period, setPeriod] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getDashboardMetrics()
            .then(setMetrics)
            .finally(() => setLoading(false));
    }, [period]);

    if (loading) {
        return (
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
                            <div className="animate-pulse bg-gray-200 rounded-xl h-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    const funnelSteps = [
        { label: 'Визиты', value: metrics.totalVisits },
        { label: 'Открыт чат', value: metrics.chatOpened },
        { label: 'Начата воронка', value: metrics.estimateStarted },
        { label: 'Завершена', value: metrics.estimateCompleted },
        { label: 'Лиды', value: metrics.leadsCreated },
    ];
    const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setPeriod(opt.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${period === opt.key
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {METRIC_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
                    <div
                        key={key}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {metrics[key as keyof DashboardMetrics]?.toLocaleString('ru')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Conversion + Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Конверсия лендинг → лид</div>
                            <div className="text-3xl font-bold text-primary-600">{metrics.conversionRate}%</div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                        />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-secondary-50 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-secondary-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Среднее время диалога</div>
                            <div className="text-3xl font-bold text-gray-900">{metrics.avgDialogDuration}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Воронка конверсии</h2>
                <div className="space-y-4">
                    {funnelSteps.map((step, i) => {
                        const pct = Math.round((step.value / maxFunnel) * 100);
                        const colors = [
                            'bg-gray-300',
                            'bg-secondary-400',
                            'bg-amber-400',
                            'bg-primary-400',
                            'bg-primary-600',
                        ];
                        return (
                            <div key={step.label} className="flex items-center gap-4">
                                <div className="w-32 text-sm text-gray-600 text-right shrink-0">{step.label}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                                    <div
                                        className={`${colors[i]} h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-700`}
                                        style={{ width: `${Math.max(pct, 5)}%` }}
                                    >
                                        <span className="text-xs font-semibold text-white drop-shadow-sm">
                                            {step.value.toLocaleString('ru')}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-12 text-sm text-gray-400 tabular-nums">{pct}%</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Быстрые действия</h3>
                    <p className="text-sm text-gray-500 mt-1">Перейдите к управлению ботом или просмотру диалогов</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/dialogs"
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 text-sm"
                    >
                        Диалоги →
                    </Link>
                    <Link
                        to="/admin/bot"
                        className="inline-flex items-center px-4 py-2 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md text-sm"
                    >
                        Настройки бота →
                    </Link>
                </div>
            </div>
        </div>
    );
}
