import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Bot, SendHorizonal } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { FUNNEL_STEPS } from '../../config/funnel'
import { useTenant } from '../../contexts/TenantContext'
import MessageBubble from './MessageBubble'
import QuickButtons from './QuickButtons'
import ProgressBar from './ProgressBar'
import TypingIndicator from './TypingIndicator'

export default function ChatWindow() {
    const tenant = useTenant()
    const {
        chatState,
        messages,
        currentFunnelStep,
        funnelAnswers,
        isTyping,
        availableSegments,
        sendUserMessage,
        closeChat,
        tenantConfig,
        isHumanManaged,
    } = useChatStore()

    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const currentStep = FUNNEL_STEPS[currentFunnelStep]

    const lastMessage = messages[messages.length - 1]
    const lastMessageRole = lastMessage?.role
    const lastMessageIsBot = lastMessageRole === 'bot' || lastMessageRole === 'manager'
    const canShowButtons = lastMessageIsBot && !isTyping && !isHumanManaged

    // Quick buttons: use tenant config if available, otherwise fallback
    const welcomeButtons = tenantConfig?.quickButtons || [
        '🧮 Рассчитать стоимость ремонта',
        '📅 Узнать сроки ремонта',
        '🏢 О компании и гарантиях',
        '💡 Советы по ремонту',
        '❓ Задать свой вопрос',
    ]

    const showQuickButtons =
        (chatState === 'WELCOME' && canShowButtons) ||
        (chatState === 'FUNNEL' && currentStep?.type === 'buttons' && canShowButtons)

    const currentButtons =
        chatState === 'WELCOME' ? welcomeButtons : currentStep?.options ?? []

    const showLeadButtons = chatState === 'LEAD_CAPTURE' && !funnelAnswers.contactChannel && canShowButtons
    const showSegmentButtons = chatState === 'SEGMENT_CHOICE' && canShowButtons
    const leadButtons = ['Telegram', 'MAX']

    const showTextInput = (canShowButtons || isHumanManaged) && (
        (chatState === 'FUNNEL' && currentStep?.type === 'text-input' && !isTyping) ||
        (chatState === 'LEAD_CAPTURE' && !isTyping) ||
        chatState === 'FREE_CHAT'
    )

    const handleSend = () => {
        if (showTextInput && inputValue.trim()) {
            sendUserMessage(inputValue.trim())
            setInputValue('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Bot display name and avatar from tenant config
    const botName = isHumanManaged ? 'Менеджер' : (tenant.bot.name || 'Макс')
    const botAvatarUrl = isHumanManaged ? null : tenant.bot.avatarUrl

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={closeChat}
        >
            <motion.div
                className="bg-white w-full sm:max-w-lg sm:rounded-3xl flex flex-col overflow-hidden h-[100dvh] sm:h-[680px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <div className="relative">
                        {botAvatarUrl ? (
                            <img
                                src={botAvatarUrl}
                                alt={botName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                                <Bot size={20} strokeWidth={1.5} />
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{botName}</p>
                        <p className="text-xs text-gray-400">AI-эксперт по ремонту</p>
                    </div>
                    <button
                        onClick={closeChat}
                        className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress */}
                <ProgressBar
                    currentStep={currentFunnelStep}
                    totalSteps={FUNNEL_STEPS.length}
                    visible={chatState === 'FUNNEL'}
                />

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scroll-smooth">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick buttons */}
                {showQuickButtons && (
                    <QuickButtons buttons={currentButtons} onSelect={sendUserMessage} />
                )}
                {showLeadButtons && (
                    <QuickButtons buttons={leadButtons} onSelect={sendUserMessage} />
                )}
                {showSegmentButtons && (
                    <QuickButtons buttons={availableSegments} onSelect={sendUserMessage} />
                )}

                {/* Input */}
                <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
                    {showTextInput ? (
                        <div className="flex gap-2 items-center">
                            <input
                                type={chatState === 'LEAD_CAPTURE' ? 'tel' : 'text'}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-50 focus:border-primary-300 transition-all"
                                placeholder={
                                    chatState === 'LEAD_CAPTURE' ? 'Введите номер телефона' :
                                        chatState === 'FREE_CHAT' ? 'Ваш вопрос...' :
                                            currentStep?.placeholder
                                }
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button
                                onClick={handleSend}
                                className="rounded-full bg-primary-500 hover:bg-primary-600 text-white p-2.5 transition-colors duration-200 flex-shrink-0"
                            >
                                <SendHorizonal size={18} />
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-1">
                            Нажмите кнопку выше, чтобы ответить
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
