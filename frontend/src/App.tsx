import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Platform pages
import PlatformLanding from './pages/platform/PlatformLanding'
import LoginPage from './pages/platform/LoginPage'
import RegisterPage from './pages/platform/RegisterPage'

// SuperAdmin pages
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import SuperDashboard from './pages/superadmin/SuperDashboard'
import TenantsList from './pages/superadmin/TenantsList'
import TenantDetail from './pages/superadmin/TenantDetail'
import AuditLogPage from './pages/superadmin/AuditLogPage'

// Tenant pages
import TenantLanding from './pages/tenant/TenantLanding'
import TenantAdminLayout from './pages/tenant/TenantAdminLayout'

// Existing admin pages (reused in tenant admin context)
import Dashboard from './pages/admin/Dashboard'
import DialogsList from './pages/admin/DialogsList'
import DialogDetail from './pages/admin/DialogDetail'
import BotSettings from './pages/admin/BotSettings'
import PricesList from './pages/admin/PricesList'
import Integrations from './pages/admin/Integrations'

// Guards
import SuperAdminGuard from './components/guards/SuperAdminGuard'
import AuthGuard from './components/guards/AuthGuard'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ===== Platform public routes ===== */}
                    <Route path="/" element={<PlatformLanding />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* ===== SuperAdmin ===== */}
                    <Route
                        path="/admin"
                        element={
                            <SuperAdminGuard>
                                <SuperAdminLayout />
                            </SuperAdminGuard>
                        }
                    >
                        <Route index element={<SuperDashboard />} />
                        <Route path="tenants" element={<TenantsList />} />
                        <Route path="tenants/:id" element={<TenantDetail />} />
                        <Route path="audit" element={<AuditLogPage />} />
                    </Route>

                    {/* ===== Tenant: landing page + chat ===== */}
                    <Route path="/:slug" element={<TenantLanding />} />

                    {/* ===== Tenant: admin panel ===== */}
                    <Route
                        path="/:slug/admin"
                        element={
                            <AuthGuard>
                                <TenantAdminLayout />
                            </AuthGuard>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="dialogs" element={<DialogsList />} />
                        <Route path="dialogs/:id" element={<DialogDetail />} />
                        <Route path="bot" element={<BotSettings />} />
                        <Route path="prices" element={<PricesList />} />
                        <Route path="integrations" element={<Integrations />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
