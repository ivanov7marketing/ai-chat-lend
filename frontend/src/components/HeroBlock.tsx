import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface HeroBlockProps {
    onStart: () => void;
    title?: string;
    subtitle?: string;
}

const FloatingElement = ({ children, className, delay = 0, duration = 4 }: { children: React.ReactNode, className?: string, delay?: number, duration?: number }) => (
    <motion.div
        className={className}
        initial={{ y: 0 }}
        animate={{
            y: [-10, 10, -10],
            rotate: [-1, 1, -1]
        }}
        transition={{
            duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay
        }}
    >
        {children}
    </motion.div>
);

const HeroBlock: React.FC<HeroBlockProps> = ({ onStart, title, subtitle }) => {
    return (
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-page">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                {/* Badges / Floating elements around Title */}
                <div className="flex justify-center mb-8 gap-16 relative">
                    <FloatingElement className="absolute -left-12 top-0 hidden lg:block" delay={0.5}>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 font-medium text-gray-700 text-sm">
                            AI Смета
                        </div>
                    </FloatingElement>

                    <FloatingElement className="absolute -right-12 top-0 hidden lg:block" delay={1.2}>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 font-medium text-gray-700 text-sm">
                            150+ смет
                        </div>
                    </FloatingElement>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-gray-950 mb-6 max-w-4xl mx-auto leading-[1.1] tracking-tight">
                    {title || (
                        <>
                            Получите примерную смету на ремонт квартиры <span className="text-primary-500 underline decoration-primary-200 underline-offset-8">«под ключ»</span> в Челябинске
                        </>
                    )}
                </h1>

                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    {subtitle || 'AI эксперт рассчитает стоимость ремонта вашей квартиры за 5 минут, на основе реальных цен из 150+ наших смет'}
                </p>

                {/* Social Proof */}
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-medium text-gray-500">150+ реальных смет</span>
                </div>

                <div className="relative inline-block group">
                    {/* Button Glow Effect */}
                    <div className="absolute inset-0 bg-primary-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />

                    <button
                        onClick={onStart}
                        className="relative z-10 flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-10 py-5 text-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    >
                        Начать бесплатно <ArrowRight size={24} />
                    </button>
                    <p className="text-sm text-gray-400 mt-4 font-medium">Без регистрации карты</p>
                </div>

                {/* Floating Mockups / Icons */}
                <div className="mt-20 relative h-[300px] hidden md:block">
                    {/* Checklist Card */}
                    <FloatingElement className="absolute left-[10%] top-0 rotate-[-4deg]" delay={0.2} duration={5}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 w-[240px] text-left">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                                <Check className="text-primary-500" size={16} />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Счет-лист</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Сантехника', price: '5 800 ₽' },
                                    { name: 'Полотенце', price: '15 000 ₽' },
                                    { name: 'Подрозетников', price: '10 000 ₽' },
                                    { name: 'Покраска', price: '3 000 ₽' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded border border-gray-200 bg-primary-50 flex items-center justify-center">
                                                <Check size={10} className="text-primary-500" />
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-800 font-bold">{item.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FloatingElement>

                    {/* Estimate Summary Card */}
                    <FloatingElement className="absolute right-[10%] top-10 rotate-[4deg]" delay={0.8} duration={6}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 w-[240px] text-left">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-primary-50 text-primary-600 px-2 py-1 rounded-md text-[10px] font-bold">Смет-маркер</div>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                </div>
                            </div>
                            <div className="mb-2">
                                <p className="text-gray-400 text-xs font-medium">Общая смета</p>
                                <p className="text-2xl font-bold text-gray-900">1 435 900 ₽</p>
                            </div>
                            <div className="space-y-2 mt-4">
                                {['Полная категория', 'Кухня', 'Ванная'].map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-white" />
                                            <span className="text-xs font-medium text-gray-700">{cat}</span>
                                        </div>
                                        <ArrowRight size={12} className="text-gray-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FloatingElement>

                    {/* Room Type Bubbles */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-40 flex gap-6">
                        {[
                            { label: 'Bathroom', delay: 1 },
                            { label: 'Kitchen', delay: 0.3 },
                            { label: 'Bedroom', delay: 0.7 },
                            { label: 'Bathroom', delay: 1.4 },
                            { label: 'Living Room', delay: 0.5 },
                        ].map((room, idx) => (
                            <FloatingElement key={idx} delay={room.delay} className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center p-3">
                                    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 italic text-[10px]">
                                        Icon
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room.label}</span>
                            </FloatingElement>
                        ))}
                    </div>

                    {/* Small tag at bottom left */}
                    <FloatingElement className="absolute left-[5%] bottom-0 lg:block hidden" delay={2}>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 font-medium text-gray-700 text-sm">
                            Ремонт
                        </div>
                    </FloatingElement>
                </div>
            </div>
        </section>
    );
};

export default HeroBlock;
