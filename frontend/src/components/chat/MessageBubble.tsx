import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Message } from '../../types/chat'
import { useChatStore } from '../../store/chatStore'

interface Props {
    message: Message
}

// Linkify phone numbers in text for ReactMarkdown
const linkifyPhones = (text: string) => {
    if (!text) return text
    // Regex for Russian phone numbers (+7, 7, 8)
    const phoneRegex = /(\+?7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g
    return text.replace(phoneRegex, (match) => {
        const clean = match.replace(/[^\d+]/g, '').replace(/^8/, '+7')
        const fullNumber = clean.startsWith('+') ? clean : `+${clean}`
        return `[${match}](tel:${fullNumber})`
    })
}

// Custom component to handle phone numbers and other basic text formatting
const MarkdownContent = ({ content }: { content: string }) => {
    return (
        <ReactMarkdown
            components={{
                p: ({ children }) => <span className="block mb-2 last:mb-0 leading-relaxed">{children}</span>,
                strong: ({ children }) => <strong className="font-bold text-black">{children}</strong>,
                a: ({ href, children }) => {
                    const isTel = href?.startsWith('tel:')
                    return (
                        <a
                            href={href}
                            target={isTel ? undefined : "_blank"}
                            rel={isTel ? undefined : "noopener noreferrer"}
                            className="text-primary-600 font-medium underline hover:text-primary-700 decoration-primary-300 underline-offset-4"
                        >
                            {children}
                        </a>
                    )
                },
                li: ({ children }) => <li className="mb-1">{children}</li>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                hr: () => <hr className="my-3 border-gray-100" />
            }}
        >
            {linkifyPhones(content)}
        </ReactMarkdown>
    )
}

export default function MessageBubble({ message }: Props) {
    const isBot = message.role === 'bot'
    const isManager = message.role === 'manager'
    const { tenantConfig } = useChatStore()
    const avatarUrl = isBot ? tenantConfig?.avatarUrl : null

    if (isBot || isManager) {
        return (
            <motion.div
                className="flex gap-3 items-end mb-4 last:mb-0"
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
                <div className={`rounded-2xl rounded-tl-sm shadow-card border px-4 py-3 text-sm leading-relaxed max-w-[85%] ${isManager ? 'bg-secondary-50 border-secondary-100 text-gray-900' : 'bg-white border-gray-100 text-gray-800'}`}>
                    {isManager && <div className="text-xs font-medium text-secondary-600 mb-2">Менеджер подключился</div>}
                    <MarkdownContent content={message.text} />
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="flex justify-end mb-4 last:mb-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%]">
                <MarkdownContent content={message.text} />
            </div>
        </motion.div>
    )
}
