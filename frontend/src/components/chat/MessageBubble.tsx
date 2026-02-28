import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { Message } from '../../types/chat'
import { useChatStore } from '../../store/chatStore'

interface Props {
    message: Message
}

const formatText = (text: string) => {
    // Regex to match various phone formats including Russian ones
    // Examples: +7 (999) 000-00-00, 89990000000, +79990000000
    const phoneRegex = /(\+?7|8)[\s-]?(\(?\d{3}\)?[\s-]?)[\d\s-]{7,10}\d/g

    if (!text) return text

    const parts = text.split(phoneRegex)
    if (parts.length === 1) return text

    // Because splitting with capturing groups in regex keeps the groups in the parts array
    // We need to carefully reconstruct the text with <a> tags
    // A simpler way for React is to use replace with a component, but string replace or regex matchAll is often easier

    const elements: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    // Reset regex index
    phoneRegex.lastIndex = 0

    while ((match = phoneRegex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            elements.push(text.substring(lastIndex, match.index))
        }

        const phoneNumber = match[0]
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace(/^8/, '+7')

        elements.push(
            <a
                key={match.index}
                href={`tel:${cleanNumber}`}
                className="text-primary-600 font-medium underline hover:text-primary-700 decoration-primary-300 underline-offset-4"
            >
                {phoneNumber}
            </a>
        )

        lastIndex = phoneRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex))
    }

    return elements
}

export default function MessageBubble({ message }: Props) {
    const isBot = message.role === 'bot'
    const isManager = message.role === 'manager'
    const { tenantConfig } = useChatStore()
    const avatarUrl = isBot ? tenantConfig?.avatarUrl : null

    if (isBot || isManager) {
        return (
            <motion.div
                className="flex gap-3 items-end"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isManager ? 'bg-secondary-50 text-secondary-600' : 'bg-primary-50 text-primary-500'}`}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                    ) : (
                        <Bot size={16} strokeWidth={1.5} />
                    )}
                </div>
                <div className={`rounded-2xl rounded-tl-sm shadow-card border px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${isManager ? 'bg-secondary-50 border-secondary-100 text-gray-900' : 'bg-white border-gray-100 text-gray-800'}`}>
                    {isManager && <div className="text-xs font-medium text-secondary-600 mb-1">Менеджер подключился</div>}
                    {formatText(message.text)}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="flex justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap">
                {formatText(message.text)}
            </div>
        </motion.div>
    )
}
