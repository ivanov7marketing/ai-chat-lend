import React from 'react';
import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white">
                    <Bot size={24} />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                    АйСмета
                </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
                <Link to="#" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">Продукты</Link>
                <Link to="#" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">Решения</Link>
                <Link to="#" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">Инструменты</Link>
            </nav>

            <div className="flex items-center gap-4">
                <button className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-gray-600 font-medium rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    Войти
                </button>
                <button className="inline-flex items-center justify-center px-6 py-2 bg-primary-500 text-white font-medium rounded-full shadow-sm hover:bg-primary-600 transition-all hover:shadow-md">
                    Начать
                </button>
            </div>
        </header>
    );
};

export default Header;
