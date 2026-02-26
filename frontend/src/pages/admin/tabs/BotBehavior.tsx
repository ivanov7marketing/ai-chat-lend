import { useEffect, useState } from 'react';
import { getBotBehavior, updateBotBehavior } from '../../../services/adminApi';
import type { BotBehavior as BotBehaviorType } from '../../../types/admin';
import { Save, Plus, X } from 'lucide-react';

export default function BotBehavior() {
    const [data, setData] = useState<BotBehaviorType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newWord, setNewWord] = useState('');

    useEffect(() => {
        getBotBehavior()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            await updateBotBehavior(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const addTrigger = () => {
        if (!data || !newWord.trim()) return;
        setData({ ...data, triggerWords: [...data.triggerWords, newWord.trim()] });
        setNewWord('');
    };

    const removeTrigger = (index: number) => {
        if (!data) return;
        setData({ ...data, triggerWords: data.triggerWords.filter((_, i) => i !== index) });
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
            {/* Trigger Words */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Триггерные слова для эскалации</h2>
                <p className="text-sm text-gray-500 mb-4">
                    При обнаружении этих слов бот предложит подключить менеджера
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {data.triggerWords.map((word, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium"
                        >
                            {word}
                            <button
                                onClick={() => removeTrigger(i)}
                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                            >
                                <X className="w-3 h-3" strokeWidth={2} />
                            </button>
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTrigger()}
                        placeholder="Новое слово или фраза..."
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                    />
                    <button
                        onClick={addTrigger}
                        disabled={!newWord.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:bg-gray-50 disabled:opacity-40 text-sm"
                    >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                        Добавить
                    </button>
                </div>
            </section>

            {/* Max Messages Without CTA */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Лимит сообщений без CTA</h2>
                <p className="text-sm text-gray-500 mb-4">
                    После N сообщений бот мягко предложит оставить контакт
                </p>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={3}
                        max={20}
                        value={data.maxMessagesWithoutCta}
                        onChange={(e) => setData({ ...data, maxMessagesWithoutCta: Number(e.target.value) })}
                        className="flex-1 h-2 bg-gray-200 rounded-full appearance-none accent-primary-500"
                    />
                    <div className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm font-semibold text-gray-900">
                        {data.maxMessagesWithoutCta}
                    </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>3</span>
                    <span>20</span>
                </div>
            </section>

            {/* Estimate Disclaimer */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Дисклеймер в смете</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Текст добавляется в конец PDF и текстового результата
                </p>
                <textarea
                    value={data.estimateDisclaimer}
                    onChange={(e) => setData({ ...data, estimateDisclaimer: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-y transition-all duration-200"
                />
            </section>

            {/* PDF TTL Notice */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Уведомление о сроке PDF</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Показывается пользователю при отправке PDF-сметы
                </p>
                <textarea
                    value={data.pdfTtlNotice}
                    onChange={(e) => setData({ ...data, pdfTtlNotice: e.target.value.slice(0, 200) })}
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-none transition-all duration-200"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{data.pdfTtlNotice.length}/200</div>
            </section>

            {/* Save */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
}
