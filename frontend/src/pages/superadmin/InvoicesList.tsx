import { useState, useEffect } from 'react';
import { getAllInvoices, markInvoicePaid } from '../../services/superAdminApi';
import { Loader2, CheckCircle, Download, Search } from 'lucide-react';

export default function InvoicesList() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const res = await getAllInvoices();
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!confirm('Отметить счет как оплаченный?')) return;
        try {
            await markInvoicePaid(id);
            loadInvoices();
        } catch (err) {
            alert('Ошибка при обновлении статуса');
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = (inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (inv.company_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Счета и оплаты</h1>
                <p className="text-sm text-gray-500 mt-1">Управление B2B счетами платформы</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по номеру или компании..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Все статусы</option>
                        <option value="pending">Ожидают</option>
                        <option value="paid">Оплачены</option>
                        <option value="cancelled">Отменены</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 font-semibold text-gray-900">№ Счета</th>
                            <th className="px-6 py-4 font-semibold text-gray-900">Компания</th>
                            <th className="px-6 py-4 font-semibold text-gray-900">Тариф / Период</th>
                            <th className="px-6 py-4 font-semibold text-gray-900">Сумма</th>
                            <th className="px-6 py-4 font-semibold text-gray-900">Статус</th>
                            <th className="px-6 py-4 font-semibold text-gray-900">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                                <td className="px-6 py-4 text-gray-600">{inv.company_name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    <span className="capitalize">{inv.plan}</span> ({inv.months} мес.)
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {Number(inv.amount || 0).toLocaleString()} ₽
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        inv.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {inv.status === 'paid' ? 'Оплачен' : inv.status === 'pending' ? 'Ожидает' : 'Отменен'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {inv.status === 'pending' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(inv.id)}
                                                className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                                                title="Отметить как оплаченный"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title="Скачать PDF">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                    <div className="p-12 text-center text-gray-400">Счетов не найдено</div>
                )}
            </div>
        </div>
    );
}
