import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
    LayoutDashboard,
    Building2,
    ScrollText,
    LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
    { to: '/admin', icon: LayoutDashboard, label: 'Дашборд', end: true },
    { to: '/admin/tenants', icon: Building2, label: 'Тенанты', end: false },
    { to: '/admin/invoices', icon: ScrollText, label: 'Счета и оплаты', end: false },
    { to: '/admin/audit', icon: ScrollText, label: 'Аудит-лог', end: false },
]

export default function SuperAdminLayout() {
    const { logout } = useAuth()

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
                {/* Header */}
                <div className="px-3 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        AI Max <span className="text-secondary-500">Super</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Управление платформой</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
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
                <div className="pt-4 border-t border-gray-100 space-y-1">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    >
                        На главную
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 w-full"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50/50">
                <Outlet />
            </main>
        </div>
    )
}
