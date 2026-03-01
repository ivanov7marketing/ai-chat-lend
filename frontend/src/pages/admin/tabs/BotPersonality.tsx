import { useEffect, useState } from 'react';
import { getBotPersonality, updateBotPersonality, uploadFile } from '../../../services/adminApi';
import type { BotPersonality as BotPersonalityType } from '../../../types/admin';
import { Save, Upload, Trash2, Camera } from 'lucide-react';

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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !data) return;
        try {
            const { url } = await uploadFile(file);
            setData({ ...data, avatarUrl: url });
        } catch (err) {
            alert('Ошибка загрузки аватара');
        }
    };

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
            {/* Avatar & Basic Info */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Основные параметры</h2>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Upload */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center">
                            {data.avatarUrl ? (
                                <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center cursor-pointer hover:bg-primary-50 hover:text-primary-600 transition-all duration-200">
                            <Upload className="w-4 h-4" strokeWidth={1.5} />
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                        {data.avatarUrl && (
                            <button
                                onClick={() => setData({ ...data, avatarUrl: null })}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
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
