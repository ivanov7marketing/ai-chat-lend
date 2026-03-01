import { useEffect, useState, useMemo } from 'react';
import { getPrices, updatePrices, addWorkType, deleteWorkType } from '../../services/adminApi';
import type { PriceRecord } from '../../types/admin';
import { Save, Plus, X, Search, Trash2, ChevronDown, Wrench } from 'lucide-react';

const CATEGORIES_ORDER = [
    'Подготовительные работы',
    'Демонтажные работы',
    'Черновая сантехника',
    'Черновая электрика',
    'Черновые отделочные работы',
    'Чистовые отделочные работы',
    'Чистовая сантехника',
    'Чистовая электрика',
    'Прочие',
    'Накладные расходы',
];

const SEGMENTS = ['Эконом', 'Стандарт', 'Комфорт', 'Премиум'];

/* ─── Types ─── */
interface GroupedCategory {
    category: string;
    subcategories: {
        name: string | null;
        items: PriceRecord[];
    }[];
    totalCount: number;
}

/* ─── Helpers ─── */
function groupByCategories(records: PriceRecord[]): GroupedCategory[] {
    const catMap = new Map<string, Map<string | null, PriceRecord[]>>();

    for (const r of records) {
        const cat = r.category || 'Без категории';
        if (!catMap.has(cat)) catMap.set(cat, new Map());

        const subMap = catMap.get(cat)!;
        const sub = r.subcategory || null;
        if (!subMap.has(sub)) subMap.set(sub, []);
        subMap.get(sub)!.push(r);
    }

    // Sort by CATEGORIES_ORDER, unknowns go to the end
    const sorted = [...catMap.entries()].sort((a, b) => {
        const ia = CATEGORIES_ORDER.indexOf(a[0]);
        const ib = CATEGORIES_ORDER.indexOf(b[0]);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    return sorted.map(([category, subMap]) => {
        const subcategories = [...subMap.entries()].map(([name, items]) => ({
            name,
            items,
        }));
        const totalCount = subcategories.reduce((sum, s) => sum + s.items.length, 0);
        return { category, subcategories, totalCount };
    });
}

/* ─── Subcategory colors for visual distinction ─── */
const SUB_COLORS = [
    { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
];

/* ═══════════════════════════════════════════════════ */
export default function PricesList() {
    const [prices, setPrices] = useState<PriceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newWork, setNewWork] = useState({
        name: '',
        unit: 'м²',
        category: CATEGORIES_ORDER[0],
        subcategory: '',
    });
    const [newPrice, setNewPrice] = useState('');

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const data = await getPrices();
            setPrices(data || []);
            // Open all categories by default on first load
            if (data?.length) {
                const cats = new Set(data.map((p: PriceRecord) => p.category || 'Без категории'));
                setOpenCategories(cats);
            }
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ─── Filtered + Grouped ─── */
    const filtered = useMemo(() => {
        if (!search.trim()) return prices;
        const q = search.toLowerCase();
        return prices.filter((p) => p.name.toLowerCase().includes(q));
    }, [prices, search]);

    const groups = useMemo(() => groupByCategories(filtered), [filtered]);

    /* ─── Handlers ─── */
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
        workTypeId: number,
        segment: string | null,
        field: 'price_min' | 'name',
        value: string
    ) => {
        setPrices((prev) =>
            prev.map((p) =>
                p.work_type_id === workTypeId && p.segment === segment
                    ? { ...p, [field]: value }
                    : p
            )
        );
    };

    const handleDelete = async (workTypeId: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот вид работ?')) return;
        try {
            await deleteWorkType(workTypeId);
            await fetchPrices();
        } catch (err) {
            console.error('Failed to delete work type:', err);
            alert('Ошибка при удалении');
        }
    };

    const handleAddWorkType = async () => {
        const pricesData = SEGMENTS.map((s) => ({
            segment: s,
            priceMin: Number(newPrice) || 0,
            priceMax: Number(newPrice) || 0,
        })).filter((p) => p.priceMin > 0 || p.priceMax > 0);

        await addWorkType({
            name: newWork.name,
            unit: newWork.unit,
            category: newWork.category,
            subcategory: newWork.subcategory,
            prices: pricesData,
        });

        setShowAddModal(false);
        setNewWork({ name: '', unit: 'м²', category: CATEGORIES_ORDER[0], subcategory: '' });
        setNewPrice('');
        await fetchPrices();
    };

    const toggleCategory = (cat: string) => {
        setOpenCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const collapseAll = () => setOpenCategories(new Set());
    const expandAll = () =>
        setOpenCategories(new Set(groups.map((g) => g.category)));

    /* ─── Loading skeleton ─── */
    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="bg-gray-200 rounded-xl h-8 w-48" />
                    <div className="bg-gray-200 rounded-2xl h-16" />
                    <div className="bg-gray-200 rounded-2xl h-16" />
                    <div className="bg-gray-200 rounded-2xl h-16" />
                    <div className="bg-gray-200 rounded-2xl h-16" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Прайс-Листы</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {prices.length} позиций • {groups.length} категорий
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

            {/* ─── Toolbar: Search + Collapse/Expand ─── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по работам..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                    />
                </div>
                <button
                    onClick={expandAll}
                    className="px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                    Развернуть все
                </button>
                <button
                    onClick={collapseAll}
                    className="px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                    Свернуть все
                </button>
            </div>

            {/* ─── Справочник работ ─── */}
            <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-gray-900">Справочник работ</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {groups.length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {search ? `Нет работ по запросу «${search}»` : 'Нет видов работ. Добавьте первый.'}
                    </div>
                )}

                {groups.map((group) => {
                    const isOpen = openCategories.has(group.category);

                    return (
                        <div key={group.category} className="border-b border-gray-100 last:border-b-0">
                            {/* ─── Category accordion header ─── */}
                            <button
                                onClick={() => toggleCategory(group.category)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors duration-200 group"
                            >
                                <div className="flex items-center gap-3">
                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                                        strokeWidth={2}
                                    />
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {group.category}
                                    </span>
                                    <span className="text-xs text-gray-400 font-normal">
                                        ({group.totalCount} позиций)
                                    </span>
                                </div>
                            </button>

                            {/* ─── Category content ─── */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                {group.subcategories.map((sub, subIdx) => {
                                    const color = SUB_COLORS[subIdx % SUB_COLORS.length];
                                    const hasSubName = sub.name !== null;

                                    return (
                                        <div key={sub.name || '__none__'} className="mx-4 mb-4">
                                            {/* Subcategory header */}
                                            {hasSubName && (
                                                <div className={`${color.bg} ${color.border} border rounded-t-xl px-4 py-2`}>
                                                    <span className={`text-sm font-semibold ${color.text}`}>
                                                        {sub.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        ({sub.items.length})
                                                    </span>
                                                </div>
                                            )}

                                            {/* Items table */}
                                            <div className={`border border-gray-100 ${hasSubName ? 'border-t-0 rounded-b-xl' : 'rounded-xl'} overflow-hidden`}>
                                                {/* Table header */}
                                                <div className="grid grid-cols-[40px_1fr_80px_80px_40px] items-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                                                    <span>№</span>
                                                    <span>Наименование</span>
                                                    <span className="text-right">Ед.изм</span>
                                                    <span className="text-right">Цена</span>
                                                    <span></span>
                                                </div>

                                                {/* Table rows */}
                                                {sub.items.map((item, itemIdx) => (
                                                    <div
                                                        key={`${item.work_type_id}-${item.segment || itemIdx}`}
                                                        className="grid grid-cols-[40px_1fr_80px_80px_40px] items-center px-4 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-150 group/row"
                                                    >
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {itemIdx + 1}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    item.work_type_id,
                                                                    item.segment,
                                                                    'name',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="text-sm font-medium text-gray-900 bg-transparent border border-transparent rounded-lg px-2 py-0.5 outline-none hover:border-gray-200 focus:border-primary-500 focus:bg-white transition-all duration-200"
                                                        />
                                                        <span className="text-xs text-gray-400 text-right">
                                                            {item.unit || '—'}
                                                        </span>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <input
                                                                type="number"
                                                                value={item.price_min || ''}
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        item.work_type_id,
                                                                        item.segment,
                                                                        'price_min',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-16 text-right text-sm font-semibold text-gray-900 bg-transparent border border-transparent rounded-lg px-1 py-0.5 outline-none hover:border-gray-200 focus:border-primary-500 focus:bg-white transition-all duration-200"
                                                                placeholder="0"
                                                            />
                                                            <span className="text-xs text-gray-300">₽</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(item.work_type_id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 opacity-0 group-hover/row:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                                            title="Удалить"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Add Work Type Modal ─── */}
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
                                        {CATEGORIES_ORDER.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Подкатегория</label>
                                <input
                                    type="text"
                                    value={newWork.subcategory}
                                    onChange={(e) => setNewWork({ ...newWork, subcategory: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all duration-200"
                                    placeholder="Например: Стены"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Цена</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
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
