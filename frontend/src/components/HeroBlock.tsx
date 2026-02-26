import React from 'react';
import { Bot } from 'lucide-react';

interface HeroBlockProps {
    onStart: () => void;
    title?: string;
    subtitle?: string;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ onStart, title, subtitle }) => {
    return (
        <section className="max-w-2xl mx-auto px-6 py-16 text-center">
            <div className="relative inline-flex mx-auto mb-8">
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                    <Bot strokeWidth={1.5} size={40} />
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
                {title || 'Получите пример сметы на ремонт квартиры под ключ с актуальными ценами в Челябинске в 2026 году'}
            </h1>

            <p className="text-lg text-gray-500 mt-4 text-center">
                {subtitle || 'AI-эксперт Макс обучен на реальных данных — он составит примерную смету, рассчитает сроки и ответит на вопросы о ремонте'}
            </p>

            <button
                onClick={onStart}
                className="rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 text-lg transition-colors duration-200 ease-out mt-8 mx-auto block w-fit"
            >
                Начать бесплатно &rarr;
            </button>
        </section>
    );
};

export default HeroBlock;
