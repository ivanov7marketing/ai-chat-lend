import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface SuperAdminGuardProps {
    children: React.ReactNode
}

export default function SuperAdminGuard({ children }: SuperAdminGuardProps) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 w-8 h-8" />
            </div>
        )
    }

    if (!isAuthenticated || user?.type !== 'superadmin') {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
