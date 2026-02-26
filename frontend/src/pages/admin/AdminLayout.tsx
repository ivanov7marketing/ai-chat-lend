import { Outlet, NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Bot,
    DollarSign,
    Plug,
    ArrowLeft,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/admin/dialogs', icon: MessageSquare, label: 'Диалоги' },
    { to: '/admin/bot', icon: Bot, label: 'Настройка бота' },
    { to: '/admin/prices', icon: DollarSign, label: 'Матрица цен' },
    { to: '/admin/integrations', icon: Plug, label: 'Интеграции' },
];

export default function AdminLayout() {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar — DESIGN.md: w-64 h-screen bg-white border-r border-gray-100 */}
            <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
                {/* Logo */}
                <div className="px-3 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        AI Max <span className="text-primary-500">Admin</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Панель управления</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/admin/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        На лендинг
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-gray-50/50">
                <Outlet />
            </main>
        </div>
    );
}
