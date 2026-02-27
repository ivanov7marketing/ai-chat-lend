import { useState, useEffect, useCallback } from 'react';
import { getBranding, updateBranding, uploadFile } from '../../services/tenantAdminApi';
import type { TenantBrandingData } from '../../types/admin';
import { Save, Loader2, Palette, Type, Image, FileText, CheckCircle, Upload, Trash2 } from 'lucide-react';

const INITIAL_BRANDING: TenantBrandingData = {
    primaryColor: '#22c55e',
    secondaryColor: '#3b82f6',
    pageTitle: '',
    pageSubtitle: '',
    heroImageUrl: null,
    companyDescription: '',
    footerText: '',
    faviconUrl: null,
    metaDescription: '',
};

export default function TenantBranding() {
    const [data, setData] = useState<TenantBrandingData>(INITIAL_BRANDING);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const loadBranding = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getBranding();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBranding();
    }, [loadBranding]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError('');
        try {
            await updateBranding(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof TenantBrandingData, value: string | null) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (field: 'heroImageUrl' | 'faviconUrl', file: File) => {
        try {
            const { url } = await uploadFile(file);
            updateField(field, url);
        } catch (err: any) {
            setError('Ошибка загрузки: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Брендинг</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Настройте внешний вид вашей посадочной страницы
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : saved ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    )}
                    {saved ? 'Сохранено!' : 'Сохранить'}
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Colors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">Цвета</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Основной цвет
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={data.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                placeholder="#22c55e"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Вторичный цвет
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.secondaryColor}
                                onChange={(e) => updateField('secondaryColor', e.target.value)}
                                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={data.secondaryColor}
                                onChange={(e) => updateField('secondaryColor', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                placeholder="#3b82f6"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Texts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">Тексты</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Заголовок страницы
                        </label>
                        <input
                            type="text"
                            value={data.pageTitle}
                            onChange={(e) => updateField('pageTitle', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            placeholder="Ремонт квартир в Челябинске"
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Подзаголовок
                        </label>
                        <input
                            type="text"
                            value={data.pageSubtitle}
                            onChange={(e) => updateField('pageSubtitle', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                            placeholder="Рассчитайте стоимость ремонта за 5 минут"
                            maxLength={255}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Описание компании
                        </label>
                        <textarea
                            value={data.companyDescription}
                            onChange={(e) => updateField('companyDescription', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-none"
                            placeholder="Расскажите о вашей компании..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Текст подвала (footer)
                        </label>
                        <textarea
                            value={data.footerText}
                            onChange={(e) => updateField('footerText', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-none"
                            placeholder="Юридическая информация..."
                        />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Image className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">Изображения</h2>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Герой-изображение
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-full sm:w-48 h-32 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative group">
                                {data.heroImageUrl ? (
                                    <>
                                        <img src={data.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => updateField('heroImageUrl', null)}
                                            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <Image className="w-8 h-8 text-gray-200" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-primary-100 transition-all duration-200">
                                    <Upload className="w-4 h-4" />
                                    {data.heroImageUrl ? 'Заменить изображение' : 'Загрузить изображение'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('heroImageUrl', file);
                                        }}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">Рекомендуемый размер: 1200x800px. Форматы: JPG, PNG, WebP.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Фавикон (Favicon)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center relative group">
                                {data.faviconUrl ? (
                                    <>
                                        <img src={data.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                                        <button
                                            onClick={() => updateField('faviconUrl', null)}
                                            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-gray-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <FileText className="w-6 h-6 text-gray-200" />
                                )}
                            </div>
                            <div>
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition-all duration-200">
                                    <Upload className="w-3.5 h-3.5" />
                                    Загрузить ICO/PNG
                                    <input
                                        type="file"
                                        accept="image/x-icon,image/png"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('faviconUrl', file);
                                        }}
                                    />
                                </label>
                                <p className="text-[10px] text-gray-400 mt-1">32x32px или 16x16px.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                    <h2 className="text-lg font-semibold text-gray-900">SEO</h2>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Meta Description
                    </label>
                    <textarea
                        value={data.metaDescription}
                        onChange={(e) => updateField('metaDescription', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-none"
                        placeholder="Описание для поисковых систем (до 300 символов)"
                        maxLength={300}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        {data.metaDescription.length} / 300
                    </p>
                </div>
            </div>
        </div>
    );
}
