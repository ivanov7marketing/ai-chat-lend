import { useEffect, useState } from 'react';
import { getIntegrations, updateIntegration, testIntegration } from '../../services/adminApi';
import type { IntegrationSettings } from '../../types/admin';
import {
    Save,
    Zap,
    Send,
    BarChart3,
    Building2,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
} from 'lucide-react';

const LLM_MODELS = [
    'anthropic/claude-sonnet-4.6',
    'openai/gpt-5.2',
    'deepseek/deepseek-v3.2',
];

export default function Integrations() {
    const [data, setData] = useState<IntegrationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ service: string; success: boolean; message: string } | null>(null);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        getIntegrations()
            .then(setData)
            .catch(err => {
                console.error('Failed to fetch integrations:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (service: string) => {
        if (!data) return;
        setSaving(service);
        try {
            const serviceData = data[service as keyof IntegrationSettings];
            await updateIntegration(service, serviceData);
        } finally {
            setSaving(null);
        }
    };

    const handleTest = async (service: string) => {
        setTesting(service);
        setTestResult(null);
        try {
            const result = await testIntegration(service);
            setTestResult({ service, ...result });
        } finally {
            setTesting(null);
        }
    };

    const toggleKeyVisibility = (key: string) => {
        setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="animate-pulse bg-gray-200 rounded-xl h-32" />
                    </div>
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки</h2>
                    <p className="text-gray-500 mb-6">
                        {error?.includes('401')
                            ? 'Ваша сессия истекла. Пожалуйста, войдите в систему заново.'
                            : (error || 'Не удалось загрузить данные интеграций.')}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
                    >
                        Попробовать снова
                    </button>
                    {error?.includes('401') && (
                        <button
                            onClick={() => {
                                localStorage.removeItem('auth_token');
                                window.location.href = '/login';
                            }}
                            className="ml-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                        >
                            К логину
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const MaskedInput = ({ value, field, onChange }: { value: string; field: string; onChange: (v: string) => void }) => (
        <div className="relative">
            <input
                type={showKeys[field] ? 'text' : 'password'}
                autoComplete="new-password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200 font-mono text-sm"
            />
            <button
                onClick={() => toggleKeyVisibility(field)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                {showKeys[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );

    const TestButton = ({ service }: { service: string }) => (
        <button
            onClick={() => handleTest(service)}
            disabled={testing === service}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
        >
            {testing === service ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
                <Zap className="w-4 h-4" strokeWidth={1.5} />
            )}
            Проверить
        </button>
    );

    const SaveButton = ({ service }: { service: string }) => (
        <button
            onClick={() => handleSave(service)}
            disabled={saving === service}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary-500 text-white font-medium rounded-full shadow-sm text-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md disabled:opacity-50"
        >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            {saving === service ? 'Сохранение...' : 'Сохранить'}
        </button>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Интеграции</h1>

            {/* Test Result Toast */}
            {testResult && (
                <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                    {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                        <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
                    )}
                    {testResult.message}
                    <button
                        onClick={() => setTestResult(null)}
                        className="ml-auto text-xs opacity-50 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {/* RouterAI */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary-50 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-secondary-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">RouterAI</h2>
                            <p className="text-xs text-gray-500">LLM-шлюз для работы AI-эксперта</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
                            <MaskedInput
                                value={data.routerAI.apiKey}
                                field="routeraiKey"
                                onChange={(v) => setData({ ...data, routerAI: { ...data.routerAI, apiKey: v } })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Основная модель</label>
                                <select
                                    value={data.routerAI.primaryModel}
                                    onChange={(e) => setData({ ...data, routerAI: { ...data.routerAI, primaryModel: e.target.value } })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                >
                                    {LLM_MODELS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fallback-модель</label>
                                <select
                                    value={data.routerAI.fallbackModel}
                                    onChange={(e) => setData({ ...data, routerAI: { ...data.routerAI, fallbackModel: e.target.value } })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                >
                                    {LLM_MODELS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Дневной лимит токенов</label>
                                <input
                                    type="number"
                                    value={data.routerAI.dailyTokenLimit}
                                    onChange={(e) => setData({ ...data, routerAI: { ...data.routerAI, dailyTokenLimit: Number(e.target.value) } })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Расход за месяц</label>
                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm">
                                    {data.routerAI.currentMonthUsage.toLocaleString('ru')} токенов • {data.routerAI.currentMonthCost.toLocaleString('ru')} ₽
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <TestButton service="routerAI" />
                            <SaveButton service="routerAI" />
                        </div>
                    </div>
                </section>

                {/* Telegram */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary-50 rounded-lg flex items-center justify-center">
                            <Send className="w-4 h-4 text-secondary-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Telegram Bot API</h2>
                            <p className="text-xs text-gray-500">Уведомления менеджера и отправка PDF</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bot Token</label>
                            <MaskedInput
                                value={data.telegram.botToken}
                                field="telegramToken"
                                onChange={(v) => setData({ ...data, telegram: { ...data.telegram, botToken: v } })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chat ID менеджера</label>
                            <input
                                type="text"
                                value={data.telegram.chatId}
                                onChange={(e) => setData({ ...data, telegram: { ...data.telegram, chatId: e.target.value } })}
                                placeholder="Получить через @userinfobot"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Шаблон уведомления</label>
                            <textarea
                                value={data.telegram.notificationTemplate}
                                onChange={(e) => setData({ ...data, telegram: { ...data.telegram, notificationTemplate: e.target.value } })}
                                rows={6}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200 resize-y font-mono text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1.5">
                                Переменные: {'{contact}'}, {'{area}'}, {'{rooms}'}, {'{type}'}, {'{segment}'}, {'{estimate_min}'}, {'{estimate_max}'}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <TestButton service="telegram" />
                            <SaveButton service="telegram" />
                        </div>
                    </div>
                </section>

                {/* Yandex Metrika */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Яндекс Метрика</h2>
                            <p className="text-xs text-gray-500">Аналитика и цели</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Номер счётчика</label>
                            <input
                                type="text"
                                value={data.yandexMetrika.counterId}
                                onChange={(e) => setData({ ...data, yandexMetrika: { ...data.yandexMetrika, counterId: e.target.value } })}
                                placeholder="12345678"
                                className="w-full max-w-xs px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Отслеживаемые события</label>
                            <div className="space-y-2">
                                {(Object.keys(data.yandexMetrika.events) as Array<keyof typeof data.yandexMetrika.events>).map((event) => (
                                    <label key={event} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                        <input
                                            type="checkbox"
                                            checked={data.yandexMetrika.events[event]}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    yandexMetrika: {
                                                        ...data.yandexMetrika,
                                                        events: { ...data.yandexMetrika.events, [event]: e.target.checked },
                                                    },
                                                })
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 font-mono">{event}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <SaveButton service="yandexMetrika" />
                        </div>
                    </div>
                </section>

                {/* amoCRM */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">amoCRM</h2>
                            <p className="text-xs text-gray-500">Автоматическое создание сделок (опционально)</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook URL</label>
                            <input
                                type="text"
                                value={data.amoCRM.webhookUrl}
                                onChange={(e) => setData({ ...data, amoCRM: { ...data.amoCRM, webhookUrl: e.target.value } })}
                                placeholder="https://your-domain.amocrm.ru/api/v4/leads"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key / OAuth Token</label>
                            <MaskedInput
                                value={data.amoCRM.apiKey}
                                field="amocrmKey"
                                onChange={(v) => setData({ ...data, amoCRM: { ...data.amoCRM, apiKey: v } })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Маппинг полей</label>
                            <div className="bg-gray-50 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            <th className="px-4 py-2 text-left">Поле системы</th>
                                            <th className="px-4 py-2 text-left">Поле amoCRM</th>
                                            <th className="px-4 py-2 text-left">ID поля</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.amoCRM.fieldMapping.map((mapping, i) => (
                                            <tr key={i} className="border-b border-gray-100">
                                                <td className="px-4 py-2 text-gray-600 font-mono text-xs">{mapping.systemField}</td>
                                                <td className="px-4 py-2 text-gray-700">{mapping.crmField}</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={mapping.crmFieldId}
                                                        onChange={(e) => {
                                                            const newMapping = [...data.amoCRM.fieldMapping];
                                                            newMapping[i] = { ...newMapping[i], crmFieldId: e.target.value };
                                                            setData({ ...data, amoCRM: { ...data.amoCRM, fieldMapping: newMapping } });
                                                        }}
                                                        placeholder="ID"
                                                        className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary-500 transition-all duration-200"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <TestButton service="amoCRM" />
                            <SaveButton service="amoCRM" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
