import React from 'react';
import HeroBlock from '../components/HeroBlock';
import QuestionCard from '../components/QuestionCard';

const EXAMPLE_QUESTIONS = [
    "Сколько стоит ремонт двушки в 2026 году?",
    "Частный мастер или компания — кого выбрать?",
    "С чего начать ремонт в новостройке?",
    "На чём можно сэкономить, а на чём нельзя?",
    "Как принять работу и проверить качество?",
    "Сколько длится ремонт под ключ?",
];

const LandingPage: React.FC = () => {
    return (
        <div className="bg-page flex flex-col min-h-screen">
            <HeroBlock onStart={() => { }} />

            <section className="flex-1">
                <div className="max-w-2xl mx-auto px-6 py-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-6">Или выберите вопрос</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-16">
                        {EXAMPLE_QUESTIONS.map((question, index) => (
                            <QuestionCard
                                key={index}
                                question={question}
                                onClick={() => { }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
