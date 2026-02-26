import { useEffect, useState } from 'react';
import { getBotPersonality, updateBotPersonality } from '../../../services/adminApi';
import type { BotPersonality as BotPersonalityType, QuickButton } from '../../../types/admin';
import { Save, Plus, X, GripVertical } from 'lucide-react';

export default function BotPersonality() {
    const [data, setData] = useState<BotPersonalityType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getBotPersonality()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            await updateBotPersonality(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const updateButton = (id: string, field: keyof QuickButton, value: string) => {
        if (!data) return;
        setData({
            ...data,
            quickButtons: data.quickButtons.map((b) =>
                b.id === id ? { ...b, [field]: value } : b
            ),
        });
    };

    const removeButton = (id: string) => {
        if (!data) return;
        setData({ ...data, quickButtons: data.quickButtons.filter((b) => b.id !== id) });
    };

    const addButton = () => {
        if (!data || data.quickButtons.length >= 6) return;
        const newBtn: QuickButton = {
            id: Date.now().toString(),
            text: '',
            emoji: '💬',
            action: 'custom',
        };
        setData({ ...data, quickButtons: [...data.quickButtons, newBtn] });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="animate-pulse bg-gray-200 rounded-xl h-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Name & Tone */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Основные параметры</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Имя AI-эксперта
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            maxLength={50}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Тон общения
                        </label>
                        <select
                            value={data.tone}
                            onChange={(e) => setData({ ...data, tone: e.target.value as BotPersonalityType['tone'] })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                        >
                            <option value="professional">Профессиональный</option>
                            <option value="friendly">Дружелюбный</option>
                            <option value="neutral">Нейтральный</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Язык
                        </label>
                        <select
                            value={data.language}
                            onChange={(e) => setData({ ...data, language: e.target.value as BotPersonalityType['language'] })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                        >
                            <option value="ru">Русский</option>
                            <option value="en">Английский</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Welcome message */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Приветственное сообщение</h2>
                <textarea
                    value={data.welcomeMessage}
                    onChange={(e) => setData({ ...data, welcomeMessage: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-y"
                    placeholder="Привет! Я Макс — AI-эксперт по ремонту квартир..."
                />
                <p className="text-xs text-gray-400 mt-2">Поддерживает Markdown-разметку</p>
            </section>

            {/* Quick Buttons */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Быстрые кнопки
                        <span className="text-sm font-normal text-gray-400 ml-2">
                            ({data.quickButtons.length}/6)
                        </span>
                    </h2>
                    {data.quickButtons.length < 6 && (
                        <button
                            onClick={addButton}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-100"
                        >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                            Добавить
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {data.quickButtons.map((btn) => (
                        <div
                            key={btn.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                            <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" strokeWidth={1.5} />
                            <input
                                type="text"
                                value={btn.emoji}
                                onChange={(e) => updateButton(btn.id, 'emoji', e.target.value)}
                                className="w-12 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm outline-none focus:border-primary-500"
                            />
                            <input
                                type="text"
                                value={btn.text}
                                onChange={(e) => updateButton(btn.id, 'text', e.target.value)}
                                maxLength={50}
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-primary-500"
                                placeholder="Текст кнопки"
                            />
                            <select
                                value={btn.action}
                                onChange={(e) => updateButton(btn.id, 'action', e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-primary-500"
                            >
                                <option value="start_funnel">Начать воронку</option>
                                <option value="ask_kb">Вопрос из БЗ</option>
                                <option value="custom">Произвольный</option>
                            </select>
                            <button
                                onClick={() => removeButton(btn.id)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Save */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                    <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
}
