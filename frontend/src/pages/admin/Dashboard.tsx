import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalLeads: 0,
        conversionRate: 0
    });

    useEffect(() => {
        // Mocking for now, can be wired to a real API later
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/dialogs?limit=1000`);
                if (res.ok) {
                    const data = await res.json();
                    const sessions = data.data || [];
                    const leads = sessions.filter((s: any) => s.status === 'converted');

                    setStats({
                        totalSessions: sessions.length,
                        totalLeads: leads.length,
                        conversionRate: sessions.length ? Math.round((leads.length / sessions.length) * 100) : 0
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Дашборд (Сводка)</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium mb-1">Всего чатов</div>
                    <div className="text-4xl font-bold text-gray-900">{stats.totalSessions}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium mb-1">Собрано лидов</div>
                    <div className="text-4xl font-bold text-blue-600">{stats.totalLeads}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium mb-1">Конверсия в контакт</div>
                    <div className="text-4xl font-bold text-green-500">{stats.conversionRate}%</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    📈
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Аналитика v2.0</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    В будущих версиях здесь появятся графики распределения бюджетов, популярные услуги, A/B тесты воронки и источники трафика (UTM).
                </p>
                <Link to="/admin/dialogs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Перейти к списку диалогов →
                </Link>
            </div>
        </div>
    );
}
