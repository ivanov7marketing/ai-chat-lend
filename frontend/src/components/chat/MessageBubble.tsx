import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { Message } from '../../types/chat'

interface Props {
    message: Message
}

export default function MessageBubble({ message }: Props) {
    const isBot = message.role === 'bot'
    const isManager = message.role === 'manager'

    if (isBot || isManager) {
        return (
            <motion.div
                className="flex gap-3 items-end"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isManager ? 'bg-secondary-50 text-secondary-600' : 'bg-primary-50 text-primary-500'}`}>
                    <Bot size={16} strokeWidth={1.5} />
                </div>
                <div className={`rounded-2xl rounded-tl-sm shadow-card border px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${isManager ? 'bg-secondary-50 border-secondary-100 text-gray-900' : 'bg-white border-gray-100 text-gray-800'}`}>
                    {isManager && <div className="text-xs font-medium text-secondary-600 mb-1">Менеджер подключился</div>}
                    {message.text}
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
            <div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[80%]">
                {message.text}
            </div>
        </motion.div>
    )
}
