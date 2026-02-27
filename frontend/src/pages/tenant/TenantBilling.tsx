import { useState, useEffect, useCallback } from 'react';
import { getBilling, getInvoices, createInvoice } from '../../services/tenantAdminApi';
import type { BillingData, UsageItem } from '../../types/admin';
import { CreditCard, Loader2, Zap, TrendingUp, Download, History } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-primary-50 text-primary-600',
    enterprise: 'bg-amber-50 text-amber-700',
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
    free: 'Тестовый доступ — до 50 сессий в месяц, 1 пользователь',
    pro: 'Рабочий аккаунт — до 1000 сессий, 3 пользователя, все настройки бота',
    enterprise: 'Неограниченный доступ, white-label, кастомный домен',
};

const USAGE_LABELS: Record<string, string> = {
    sessions: 'Сессии',
    messages: 'Сообщения',
    leads: 'Лиды',
    tokens: 'Токены AI',
    team: 'Сотрудники',
};

function UsageBar({ label, item }: { label: string; item: any }) {
    const percent = item.limit > 0
        ? Math.min(100, Math.round((item.used / item.limit) * 100))
        : 0;
    const isWarning = percent >= 80;
    const isCritical = percent >= 95;

    const formatNumber = (n: number) => {
        if (n >= 999999) return '∞';
        if (n >= 1000) return `${Math.round(n / 1000)}K`;
        return n.toString();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-500">
                    {formatNumber(item.used)} / {formatNumber(item.limit)}
                </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isCritical
                        ? 'bg-red-500'
                        : isWarning
                            ? 'bg-amber-400'
                            : 'bg-primary-500'
                        }`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export default function TenantBilling() {
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [billingRes, invoicesRes] = await Promise.all([
                getBilling(),
                getInvoices()
            ]);
            setData(billingRes);
            setInvoices(invoicesRes.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreateInvoice = async (plan: string, months: number, amount: number) => {
        try {
            setRequesting(true);
            await createInvoice({ plan, months, amount });
            loadData();
            alert('Счет успешно создан! Вы можете скачать его в истории платежей.');
        } catch (err: any) {
            alert('Ошибка: ' + err.message);
        } finally {
            setRequesting(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl">
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error || 'Не удалось загрузить данные'}
                </div>
            </div>
        );
    }

    const trialDaysLeft = data.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000))
        : null;

    return (
        <div className="p-6 lg:p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Биллинг</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Тариф и использование ресурсов
                </p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">Текущий тариф</h2>
                </div>
                <div className="flex items-center gap-4 mb-3">
                    <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-lg font-bold ${PLAN_COLORS[data.plan] || PLAN_COLORS.free
                            }`}
                    >
                        {PLAN_LABELS[data.plan] || data.plan}
                    </span>
                    {trialDaysLeft !== null && trialDaysLeft > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            Триал: {trialDaysLeft} дн.
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    {PLAN_DESCRIPTIONS[data.plan] || ''}
                </p>
            </div>

            {/* Usage */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Использование за текущий месяц
                    </h2>
                </div>
                <div className="space-y-5">
                    {Object.entries(data.usage).map(([key, item]) => (
                        <UsageBar
                            key={key}
                            label={USAGE_LABELS[key] || key}
                            item={item as UsageItem}
                        />
                    ))}
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Сравнение тарифов</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['free', 'pro', 'enterprise'] as const).map((plan) => {
                        const isCurrent = data.plan === plan;
                        return (
                            <div
                                key={plan}
                                className={`rounded-2xl border p-5 transition-all duration-200 ${isCurrent
                                    ? 'border-primary-500 bg-primary-50/30 ring-2 ring-primary-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${PLAN_COLORS[plan]
                                            }`}
                                    >
                                        {PLAN_LABELS[plan]}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-xs text-primary-600 font-medium">
                                            Текущий
                                        </span>
                                    )}
                                </div>
                                <ul className="text-sm text-gray-600 space-y-1.5">
                                    <li>
                                        Сессии:{' '}
                                        {plan === 'enterprise' ? '∞' : plan === 'pro' ? '1 000' : '50'}
                                        /мес
                                    </li>
                                    <li>
                                        Сотрудники:{' '}
                                        {plan === 'enterprise' ? '∞' : plan === 'pro' ? '3' : '1'}
                                    </li>
                                    <li>
                                        Токены:{' '}
                                        {plan === 'enterprise' ? '∞' : plan === 'pro' ? '500K' : '10K'}
                                        /день
                                    </li>
                                    {plan !== 'free' && <li>PDF-сметы</li>}
                                    {plan === 'enterprise' && <li>Кастомный домен</li>}
                                    {plan === 'enterprise' && <li>White-label</li>}
                                </ul>
                                {!isCurrent && (
                                    <button
                                        onClick={() => handleCreateInvoice(plan, plan === 'pro' ? 12 : 6, plan === 'pro' ? 24000 : 90000)}
                                        disabled={requesting}
                                        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
                                    >
                                        {requesting ? 'Запрос...' : `Сменить на ${PLAN_LABELS[plan]}`}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invoices History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                        <h2 className="text-lg font-semibold text-gray-900">История счетов</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-900">№ Счета</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Дата</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Сумма</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Статус</th>
                                <th className="px-6 py-4 font-semibold text-gray-900"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoices.map((inv: any) => (
                                <tr key={inv.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(inv.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">{Number(inv.amount).toLocaleString()} ₽</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {inv.status === 'paid' ? 'Оплачен' : 'Ожидает'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && (
                        <div className="py-12 text-center text-gray-400">История платежей пуста</div>
                    )}
                </div>
            </div>
        </div>
    );
}
