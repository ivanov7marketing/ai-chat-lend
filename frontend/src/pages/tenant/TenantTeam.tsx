import { useState, useEffect, useCallback } from 'react';
import {
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
} from '../../services/tenantAdminApi';
import type { TeamMember } from '../../types/admin';
import {
    Plus,
    Loader2,
    Shield,
    UserCog,
    Trash2,
    X,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    manager: 'Менеджер',
    content_manager: 'Контент-менеджер',
};

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-amber-50 text-amber-700',
    admin: 'bg-blue-50 text-blue-700',
    manager: 'bg-green-50 text-green-700',
    content_manager: 'bg-gray-100 text-gray-600',
};

export default function TenantTeam() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    // New member form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('manager');
    const [adding, setAdding] = useState(false);

    const loadMembers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTeamMembers();
            setMembers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const handleAdd = async () => {
        if (!newName || !newEmail || !newPassword) return;
        setAdding(true);
        setError('');
        try {
            await addTeamMember({
                name: newName,
                email: newEmail,
                password: newPassword,
                role: newRole,
            });
            setShowModal(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewRole('manager');
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleToggleActive = async (member: TeamMember) => {
        try {
            await updateTeamMember(member.id, { isActive: !member.is_active });
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleChangeRole = async (member: TeamMember, role: string) => {
        try {
            await updateTeamMember(member.id, { role });
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRemove = async (member: TeamMember) => {
        if (!confirm(`Удалить пользователя ${member.name || member.email}?`)) return;
        try {
            await removeTeamMember(member.id);
            await loadMembers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Команда</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Управляйте доступом сотрудников к админ-панели
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-700 active:translate-y-0"
                >
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Добавить сотрудника
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Team Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-3">Сотрудник</th>
                            <th className="px-4 py-3">Роль</th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3">Последний вход</th>
                            <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                    Нет добавленных сотрудников
                                </td>
                            </tr>
                        )}
                        {members.map((m) => (
                            <tr
                                key={m.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                                            {(m.name || m.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {m.name || '—'}
                                            </div>
                                            <div className="text-xs text-gray-400">{m.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    {m.role === 'owner' ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
                                            <Shield className="w-3.5 h-3.5" />
                                            {ROLE_LABELS[m.role]}
                                        </span>
                                    ) : (
                                        <select
                                            value={m.role}
                                            onChange={(e) => handleChangeRole(m, e.target.value)}
                                            className="px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary-500"
                                        >
                                            <option value="admin">Администратор</option>
                                            <option value="manager">Менеджер</option>
                                            <option value="content_manager">Контент-менеджер</option>
                                        </select>
                                    )}
                                </td>
                                <td className="px-4 py-3.5">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${m.is_active
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-600'
                                            }`}
                                    >
                                        {m.is_active ? 'Активен' : 'Деактивирован'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-gray-500 text-sm">
                                    {m.last_login_at
                                        ? new Date(m.last_login_at).toLocaleDateString('ru-RU')
                                        : '—'}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                    {m.role !== 'owner' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(m)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                                                title={m.is_active ? 'Деактивировать' : 'Активировать'}
                                            >
                                                {m.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" strokeWidth={1.5} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(m)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Legend */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                    <UserCog className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                    <h3 className="text-sm font-semibold text-gray-700">Описание ролей</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-start gap-2">
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[key]
                                    }`}
                            >
                                {label}
                            </span>
                            <span className="text-gray-500">
                                {key === 'owner'
                                    ? 'Полный доступ, биллинг, управление командой'
                                    : key === 'admin'
                                        ? 'Всё, кроме биллинга'
                                        : key === 'manager'
                                            ? 'Дашборд, диалоги, настройки бота (чтение)'
                                            : 'Справочник цен, база знаний'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Member Modal */}
            {showModal && (
                <>
                    <div
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 z-50">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Добавить сотрудника
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                    placeholder="Иван Иванов"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                    placeholder="ivan@company.ru"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Пароль
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                    placeholder="Минимум 8 символов"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Роль
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                >
                                    <option value="admin">Администратор</option>
                                    <option value="manager">Менеджер</option>
                                    <option value="content_manager">Контент-менеджер</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={adding || !newName || !newEmail || !newPassword}
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {adding ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Добавить
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
