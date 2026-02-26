import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    MessageSquare,
    BarChart3,
    FileText,
    Zap,
    Shield,
    Settings,
    Check,
    ArrowRight,
    ChevronDown,
    Bot,
} from 'lucide-react'

const FEATURES = [
    {
        icon: Bot,
        title: 'AI-бот эксперт',
        desc: 'Персональный AI-ассистент по ремонту. Настройте имя, тон общения и приветствие.',
    },
    {
        icon: MessageSquare,
        title: 'Воронка расчёта',
        desc: '8-шаговая воронка. Пользователь получает смету за 2 минуты.',
    },
    {
        icon: BarChart3,
        title: 'Дашборд и аналитика',
        desc: 'Конверсии, диалоги, воронка — всё в реальном времени.',
    },
    {
        icon: FileText,
        title: 'PDF-сметы',
        desc: 'Автоматическая генерация PDF и отправка клиенту.',
    },
    {
        icon: Shield,
        title: 'Ваш бренд',
        desc: 'Логотип, цвета, тексты — полная кастомизация лендинга.',
    },
    {
        icon: Settings,
        title: 'Интеграции',
        desc: 'Telegram, amoCRM, Яндекс Метрика — подключайте за минуту.',
    },
]

const STEPS = [
    { num: '01', title: 'Регистрация', desc: 'Укажите название компании и город. Займёт 30 секунд.' },
    { num: '02', title: 'Настройка бота', desc: 'Загрузите логотип, настройте цены и приветствие.' },
    { num: '03', title: 'Получайте лиды', desc: 'Разместите ссылку — бот начнёт собирать заявки.' },
]

const PLANS = [
    {
        name: 'Free',
        price: '0',
        desc: 'Попробуйте бесплатно',
        features: ['50 сессий / мес', '1 пользователь', 'Базовый бот', 'Стандартный бренд'],
        cta: 'Начать бесплатно',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: '2 990',
        desc: 'Для активных компаний',
        features: ['1 000 сессий / мес', '3 пользователя', 'PDF-сметы', 'RAG база знаний', 'Telegram + CRM'],
        cta: 'Подключить Pro',
        highlighted: true,
    },
    {
        name: 'Enterprise',
        price: 'По запросу',
        desc: 'Без ограничений',
        features: ['Безлимит сессий', 'Неограниченно пользователей', 'White-label', 'Кастомный домен', 'Приоритетная поддержка'],
        cta: 'Связаться',
        highlighted: false,
    },
]

const FAQ = [
    { q: 'Как быстро можно запустить бота?', a: 'Регистрация и базовая настройка занимают около 5 минут. После этого бот готов принимать клиентов.' },
    { q: 'Нужны ли технические навыки?', a: 'Нет. Вся настройка происходит в визуальном интерфейсе — без кода и без разработчиков.' },
    { q: 'Можно ли загрузить свой прайс-лист?', a: 'Да. В админке есть раздел «Матрица цен», где вы задаёте виды работ и цены по сегментам.' },
    { q: 'Есть ли триальный период для Pro?', a: 'Да, 14 дней бесплатного Pro-доступа при регистрации.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = React.useState(false)
    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
                <span className="text-base font-medium text-gray-900">{q}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                />
            </button>
            {open && (
                <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
                </div>
            )}
        </div>
    )
}

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
}

export default function PlatformLanding() {
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* ===== Nav ===== */}
            <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <Link to="/" className="text-xl font-bold text-gray-900 tracking-tight">
                    AI Max<span className="text-primary-500">.</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-4 py-2 bg-transparent text-gray-600 font-medium rounded-full transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Войти
                    </Link>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5"
                    >
                        Регистрация
                    </Link>
                </div>
            </nav>

            {/* ===== Hero ===== */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 opacity-60" />
                <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-600 mb-6">
                            <Zap className="w-4 h-4 mr-1.5" strokeWidth={2} />
                            SaaS-платформа для компаний по ремонту
                        </span>
                        <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
                            Создайте AI-чат для расчёта{' '}
                            <span className="text-primary-500">сметы за 5 минут</span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
                            AI-бот ведёт клиента через воронку, рассчитывает стоимость ремонта
                            и собирает заявку — пока вы занимаетесь работой.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-primary-500 text-white font-medium rounded-full shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5 text-lg"
                            >
                                Попробовать бесплатно
                                <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== How it works ===== */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-4xl font-semibold text-gray-900 text-center tracking-tight mb-4">
                        Как это работает
                    </h2>
                    <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
                        Три простых шага — и ваш AI-бот готов принимать клиентов.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.num}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-40px' }}
                                variants={fadeUp}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Features ===== */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-4xl font-semibold text-gray-900 text-center tracking-tight mb-4">
                        Всё что нужно для лидогенерации
                    </h2>
                    <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
                        Мощный набор инструментов в одном решении.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-40px' }}
                                variants={fadeUp}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                                    <f.icon className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Pricing ===== */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-4xl font-semibold text-gray-900 text-center tracking-tight mb-4">
                        Тарифы
                    </h2>
                    <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
                        Начните бесплатно, масштабируйтесь когда будете готовы.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.name}
                                className={`rounded-2xl border p-6 flex flex-col ${plan.highlighted
                                        ? 'border-primary-500 shadow-md ring-1 ring-primary-200'
                                        : 'border-gray-100 shadow-sm'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600 mb-3">
                                        Популярный
                                    </span>
                                )}
                                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mt-1 mb-4">{plan.desc}</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                    {plan.price !== 'По запросу' && (
                                        <span className="text-gray-400 ml-1">₽ / мес</span>
                                    )}
                                </div>
                                <ul className="space-y-2.5 flex-1 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" strokeWidth={2} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/register"
                                    className={`inline-flex items-center justify-center px-6 py-3 font-medium rounded-full shadow-sm transition-all duration-200 text-center ${plan.highlighted
                                            ? 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-semibold text-gray-900 text-center tracking-tight mb-12">
                        Частые вопросы
                    </h2>
                    <div className="space-y-3">
                        {FAQ.map((item) => (
                            <FaqItem key={item.q} {...item} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="bg-white border-t border-gray-100 py-10">
                <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} AI Max. Все права защищены.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="/terms" className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            Условия
                        </a>
                        <a href="/privacy" className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            Конфиденциальность
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
