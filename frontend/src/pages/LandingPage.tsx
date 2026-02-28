import React from 'react';
import Header from '../components/Header';
import HeroBlock from '../components/HeroBlock';
import QuestionCard from '../components/QuestionCard';
import { AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import ChatWindow from '../components/chat/ChatWindow'

const EXAMPLE_QUESTIONS = [
    "Сколько стоит ремонт двушки в 2026 году?",
    "Частный мастер или компания — кого выбрать?",
    "С чего начать ремонт в новостройке?",
    "На чём можно сэкономить, а на чём нельзя?",
    "Как принять работу и проверить качество?",
    "Сколько длится ремонт под ключ?",
];

const LandingPage: React.FC = () => {
    const { openChat, isOpen } = useChatStore()
    return (
        <div className="bg-page flex flex-col min-h-screen font-sans">
            <Header />
            <HeroBlock onStart={() => openChat()} />

            <section className="flex-1">
                <div className="max-w-2xl mx-auto px-6 py-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-6">Или выберите вопрос</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-16">
                        {EXAMPLE_QUESTIONS.map((question, index) => (
                            <QuestionCard
                                key={index}
                                question={question}
                                onClick={() => openChat(question)}
                            />
                        ))}
                    </div>
                </div>
            </section>
            <AnimatePresence>
                {isOpen && <ChatWindow />}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
