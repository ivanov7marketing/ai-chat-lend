import { Outlet, NavLink, Link, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { TenantProvider, useTenant } from '../../contexts/TenantContext'
import {
    LayoutDashboard,
    MessageSquare,
    Bot,
    DollarSign,
    Plug,
    Palette,
    Users,
    CreditCard,
    ArrowLeft,
    LogOut,
} from 'lucide-react'

function TenantAdminContent() {
    const { slug } = useParams<{ slug: string }>()
    const { logout } = useAuth()

    let companyName = 'Панель управления'
    try {
        const tenant = useTenant()
        companyName = tenant.companyName || companyName
    } catch {
        // TenantContext might not be available if config hasn't loaded yet
    }

    const NAV_ITEMS = [
        { to: `/${slug}/admin/dashboard`, icon: LayoutDashboard, label: 'Дашборд' },
        { to: `/${slug}/admin/dialogs`, icon: MessageSquare, label: 'Диалоги' },
        { to: `/${slug}/admin/bot`, icon: Bot, label: 'Настройка бота' },
        { to: `/${slug}/admin/prices`, icon: DollarSign, label: 'Матрица цен' },
        { to: `/${slug}/admin/integrations`, icon: Plug, label: 'Интеграции' },
        { to: `/${slug}/admin/branding`, icon: Palette, label: 'Брендинг' },
        { to: `/${slug}/admin/team`, icon: Users, label: 'Команда' },
        { to: `/${slug}/admin/billing`, icon: CreditCard, label: 'Биллинг' },
    ]

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
                {/* Logo + Company Name */}
                <div className="px-3 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        AI Max <span className="text-primary-500">Admin</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5 truncate" title={companyName}>
                        {companyName}
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to.endsWith('/dashboard')}
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
                        to={`/${slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        На лендинг
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

export default function TenantAdminLayout() {
    return (
        <TenantProvider>
            <TenantAdminContent />
        </TenantProvider>
    )
}
