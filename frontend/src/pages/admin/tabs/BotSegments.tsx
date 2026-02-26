import { useEffect, useState } from 'react';
import { getBotSegments, updateBotSegment } from '../../../services/adminApi';
import type { RepairSegment } from '../../../types/admin';
import { Save, Edit3 } from 'lucide-react';

const SEGMENT_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
    'Эконом': { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-600' },
    'Стандарт': { bg: 'bg-secondary-50', border: 'border-secondary-200', accent: 'text-secondary-600' },
    'Комфорт': { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-600' },
    'Премиум': { bg: 'bg-primary-50', border: 'border-primary-200', accent: 'text-primary-600' },
};

export default function BotSegments() {
    const [segments, setSegments] = useState<RepairSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getBotSegments()
            .then(setSegments)
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = (id: number, field: keyof RepairSegment, value: string | number) => {
        setSegments((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSave = async (segment: RepairSegment) => {
        setSaving(true);
        try {
            await updateBotSegment(segment);
            setEditingId(null);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="animate-pulse bg-gray-200 rounded-xl h-40" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {segments.map((seg) => {
                const colors = SEGMENT_COLORS[seg.name] || SEGMENT_COLORS['Эконом'];
                const isEditing = editingId === seg.id;

                return (
                    <div
                        key={seg.id}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow duration-300 ${isEditing ? 'ring-2 ring-primary-200' : ''
                            }`}
                    >
                        {/* Header */}
                        <div className={`px-6 py-3 ${colors.bg} border-b ${colors.border} flex items-center justify-between`}>
                            <h3 className={`font-semibold ${colors.accent}`}>{seg.name}</h3>
                            <button
                                onClick={() => setEditingId(isEditing ? null : seg.id)}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${isEditing ? 'bg-white text-primary-600' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                    }`}
                            >
                                <Edit3 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
                                {isEditing ? (
                                    <textarea
                                        value={seg.description}
                                        onChange={(e) => handleUpdate(seg.id, 'description', e.target.value)}
                                        rows={3}
                                        maxLength={300}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-y"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600 leading-relaxed">{seg.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Что входит</label>
                                {isEditing ? (
                                    <textarea
                                        value={seg.whatIncluded}
                                        onChange={(e) => handleUpdate(seg.id, 'whatIncluded', e.target.value)}
                                        rows={5}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-mono outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 resize-y"
                                    />
                                ) : (
                                    <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{seg.whatIncluded}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Цена от (₽/м²)</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={seg.priceRangeMin}
                                            onChange={(e) => handleUpdate(seg.id, 'priceRangeMin', Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-gray-900">{seg.priceRangeMin.toLocaleString('ru')} ₽</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Цена до (₽/м²)</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={seg.priceRangeMax}
                                            onChange={(e) => handleUpdate(seg.id, 'priceRangeMax', Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-gray-900">{seg.priceRangeMax.toLocaleString('ru')} ₽</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Типичные материалы</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={seg.typicalMaterials}
                                        onChange={(e) => handleUpdate(seg.id, 'typicalMaterials', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                                    />
                                ) : (
                                    <div className="text-sm text-gray-500">{seg.typicalMaterials}</div>
                                )}
                            </div>

                            {/* Save */}
                            {isEditing && (
                                <button
                                    onClick={() => handleSave(seg)}
                                    disabled={saving}
                                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 disabled:opacity-50 text-sm"
                                >
                                    <Save className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                                    {saving ? 'Сохранение...' : 'Сохранить сегмент'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
