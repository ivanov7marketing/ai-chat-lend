import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        AI Max Admin
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin/dialogs" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        Диалоги и Лиды
                    </Link>
                    <div className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed">
                        Матрица цен (в разработке)
                    </div>
                </nav>
                <div className="p-4 border-t">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        ← Вернуться на лендинг
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
