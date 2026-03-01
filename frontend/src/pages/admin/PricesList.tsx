import { useEffect, useState } from 'react';
import { getPrices, updatePrices, addWorkType } from '../../services/adminApi';
import type { PriceRecord } from '../../types/admin';
import { Save, Plus, X, Filter, Trash2 } from 'lucide-react';

const CATEGORIES = ['Все', 'Подготовительные работы', 'Демонтажные работы', 'Черновая сантехника', 'Черновая электрика', 'Черновые отделочные', 'Чистовые отделочные', 'Чистовая сантехника', 'Чистовая электрика', 'Прочие', 'Накладные расходы'];
const SEGMENTS = ['Эконом', 'Стандарт', 'Комфорт', 'Премиум'];

export default function PricesList() {
    const [prices, setPrices] = useState<PriceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState('Все');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newWork, setNewWork] = useState({ name: '', unit: 'м²', category: 'Подготовительные работы' });
    const [newPrices, setNewPrices] = useState<Record<string, { min: string; max: string }>>(
        Object.fromEntries(SEGMENTS.map((s) => [s, { min: '', max: '' }]))
    );

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const data = await getPrices();
            setPrices(data || []);
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = prices
                .filter((p) => p.segment)
                .map((p) => ({
                    workTypeId: p.work_type_id,
                    segment: p.segment!,
                    priceMin: Number(p.price_min) || 0,
                    priceMax: Number(p.price_max) || 0,
                }));
            await updatePrices(updates);
            await fetchPrices();
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (
        index: number,
        field: 'price_min' | 'price_max' | 'segment' | 'name',
        value: string
    ) => {
        const newList = [...prices];
        newList[index] = { ...newList[index], [field]: value };
        setPrices(newList);
    };

    const handleDelete = (index: number) => {
        const newList = [...prices];
        newList.splice(index, 1);
        setPrices(newList);
    };

    const handleAddWorkType = async () => {
        const pricesData = SEGMENTS.map((s) => ({
            segment: s,
            priceMin: Number(newPrices[s].min) || 0,
            priceMax: Number(newPrices[s].max) || 0,
        })).filter((p) => p.priceMin > 0 || p.priceMax > 0);

        await addWorkType({
            name: newWork.name,
            unit: newWork.unit,
            category: newWork.category,
            prices: pricesData,
        });

        setShowAddModal(false);
        setNewWork({ name: '', unit: 'м²', category: 'Подготовительные работы' });
        setNewPrices(Object.fromEntries(SEGMENTS.map((s) => [s, { min: '', max: '' }])));
        await fetchPrices();
    };

    const filtered = filterCategory === 'Все'
        ? prices
        : prices.filter((p) => p.category === filterCategory);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="bg-gray-200 rounded-xl h-8 w-48" />
                    <div className="bg-gray-200 rounded-2xl h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Матрица цен</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Цены актуальны на февраль 2026 • {prices.length} записей
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 text-sm"
                    >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                        Добавить вид работ
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md disabled:opacity-50 text-sm"
                    >
                        <Save className="w-4 h-4" strokeWidth={1.5} />
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filterCategory === cat
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-3">Наименование работ</th>
                                <th className="px-4 py-3 w-32">Ед. изм.</th>
                                <th className="px-4 py-3 w-36">Цена</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, index) => {
                                const realIndex = prices.indexOf(p);
                                return (
                                    <tr
                                        key={`${p.work_type_id}-${p.segment || index}`}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3.5">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(e) => handleInputChange(realIndex, 'name', e.target.value)}
                                                className="w-full px-3 py-1.5 bg-transparent border border-transparent rounded-lg text-sm font-medium text-gray-900 outline-none hover:border-gray-200 focus:border-primary-500 focus:bg-white transition-all duration-200"
                                            />
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500">{p.unit || '—'}</td>
                                        <td className="px-4 py-3.5">
                                            <input
                                                type="number"
                                                value={p.price_min || ''}
                                                onChange={(e) => handleInputChange(realIndex, 'price_min', e.target.value)}
                                                className="w-28 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500 transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => handleDelete(realIndex)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                        {filterCategory === 'Все'
                                            ? 'Нет видов работ. Добавьте первый.'
                                            : `Нет работ в категории «${filterCategory}».`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Work Type Modal */}
            {showAddModal && (
                <>
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 z-50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Добавить вид работ</h3>
                                <p className="text-sm text-gray-500 mt-1">Заполните информацию о новом виде работ</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                            >
                                <X className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
                                <input
                                    type="text"
                                    value={newWork.name}
                                    onChange={(e) => setNewWork({ ...newWork, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                    placeholder="Штукатурка стен по маякам"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Единица измерения</label>
                                    <input
                                        type="text"
                                        value={newWork.unit}
                                        onChange={(e) => setNewWork({ ...newWork, unit: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
                                    <select
                                        value={newWork.category}
                                        onChange={(e) => setNewWork({ ...newWork, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                    >
                                        {CATEGORIES.filter((c) => c !== 'Все').map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Цена</label>
                                <input
                                    type="number"
                                    value={newPrices['Стандарт']?.min || ''}
                                    onChange={(e) => setNewPrices({ ...newPrices, 'Стандарт': { min: e.target.value, max: e.target.value } })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full transition-all duration-200 hover:bg-gray-50 text-sm"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleAddWorkType}
                                disabled={!newWork.name.trim()}
                                className="flex-1 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 disabled:opacity-50 text-sm"
                            >
                                Добавить
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
