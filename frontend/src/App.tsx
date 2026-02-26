import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './pages/admin/AdminLayout';
import DialogsList from './pages/admin/DialogsList';
import DialogDetail from './pages/admin/DialogDetail';
import PricesList from './pages/admin/PricesList';
import Dashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dialogs" element={<DialogsList />} />
                    <Route path="dialogs/:id" element={<DialogDetail />} />
                    <Route path="prices" element={<PricesList />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
