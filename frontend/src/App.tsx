import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './pages/admin/AdminLayout';
import DialogsList from './pages/admin/DialogsList';
import DialogDetail from './pages/admin/DialogDetail';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<DialogsList />} />
                    <Route path="dialogs" element={<DialogsList />} />
                    <Route path="dialogs/:id" element={<DialogDetail />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
