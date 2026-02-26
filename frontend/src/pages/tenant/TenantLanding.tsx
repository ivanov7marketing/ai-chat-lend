import React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { TenantProvider, useTenant } from '../../contexts/TenantContext'
import HeroBlock from '../../components/HeroBlock'
import QuestionCard from '../../components/QuestionCard'
import ChatWindow from '../../components/chat/ChatWindow'

const EXAMPLE_QUESTIONS = [
    'Сколько стоит ремонт двушки в 2026 году?',
    'Частный мастер или компания — кого выбрать?',
    'С чего начать ремонт в новостройке?',
    'На чём можно сэкономить, а на чём нельзя?',
    'Как принять работу и проверить качество?',
    'Сколько длится ремонт под ключ?',
]

function TenantLandingContent() {
    const tenant = useTenant()
    const { openChat, isOpen, setTenantSlug } = useChatStore()
    const { slug } = useParams<{ slug: string }>()

    // Set tenant slug in chat store for WebSocket routing
    React.useEffect(() => {
        if (slug && setTenantSlug) {
            setTenantSlug(slug)
        }
    }, [slug, setTenantSlug])

    // Dynamic CSS vars from tenant branding
    const brandStyle = {
        '--brand-primary': tenant.branding.primaryColor,
        '--brand-secondary': tenant.branding.secondaryColor,
    } as React.CSSProperties

    return (
        <div className="bg-page flex flex-col min-h-screen" style={brandStyle}>
            <HeroBlock
                onStart={() => openChat()}
                title={tenant.branding.pageTitle || undefined}
                subtitle={tenant.branding.pageSubtitle || undefined}
            />

            <section className="flex-1">
                <div className="max-w-2xl mx-auto px-6 py-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-6">
                        Или выберите вопрос
                    </h2>
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
    )
}

export default function TenantLanding() {
    return (
        <TenantProvider>
            <TenantLandingContent />
        </TenantProvider>
    )
}
