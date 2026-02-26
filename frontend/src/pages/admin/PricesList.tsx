import { useEffect, useState } from 'react';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

interface PriceRecord {
    work_type_id: number;
    name: string;
    unit: string | null;
    category: string | null;
    segment: string | null;
    price_min: string | null;
    price_max: string | null;
}

export default function PricesList() {
    const [prices, setPrices] = useState<PriceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/prices`);
            if (res.ok) {
                const data = await res.json();
                setPrices(data || []);
            } else {
                console.error("Failed to fetch prices:", await res.text());
            }
        } catch (err) {
            console.error("Network error fetching prices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = prices.filter(p => p.segment).map(p => ({
                workTypeId: p.work_type_id,
                segment: p.segment!,
                priceMin: Number(p.price_min) || 0,
                priceMax: Number(p.price_max) || 0,
            }));

            const res = await fetch(`${API_BASE}/api/admin/prices`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                alert('Цены успешно сохранены!');
                await fetchPrices();
            } else {
                alert('Ошибка при сохранении цен.');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети при сохранении.');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (index: number, field: 'price_min' | 'price_max' | 'segment', value: string) => {
        const newPrices = [...prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        setPrices(newPrices);
    };

    if (loading) return <div className="p-8 text-gray-500">Загрузка матрицы цен...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Матрица цен</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                            <th className="p-4 font-normal">Категория</th>
                            <th className="p-4 font-normal">Вид работ</th>
                            <th className="p-4 font-normal">Ед. изм.</th>
                            <th className="p-4 font-normal">Сегмент</th>
                            <th className="p-4 font-normal">Цена (от)</th>
                            <th className="p-4 font-normal">Цена (до)</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {prices.map((p, index) => (
                            <tr key={`${p.work_type_id}-${p.segment || index}`} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-4 text-gray-500">{p.category || '—'}</td>
                                <td className="p-4 font-medium text-gray-900">{p.name}</td>
                                <td className="p-4 text-gray-500">{p.unit || '—'}</td>
                                <td className="p-4">
                                    <select
                                        value={p.segment || ''}
                                        onChange={(e) => handleInputChange(index, 'segment', e.target.value)}
                                        className="border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Выберите...</option>
                                        <option value="Эконом">Эконом</option>
                                        <option value="Стандарт">Стандарт</option>
                                        <option value="Комфорт">Комфорт</option>
                                        <option value="Премиум">Премиум</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <input
                                        type="number"
                                        value={p.price_min || ''}
                                        onChange={(e) => handleInputChange(index, 'price_min', e.target.value)}
                                        className="w-24 border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="p-4">
                                    <input
                                        type="number"
                                        value={p.price_max || ''}
                                        onChange={(e) => handleInputChange(index, 'price_max', e.target.value)}
                                        className="w-24 border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {prices.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Нет добавленных видов работ. База пуста.</div>
                )}
            </div>
        </div>
    );
}
