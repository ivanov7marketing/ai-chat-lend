import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { Message } from '../../types/chat'

interface Props {
    message: Message
}

export default function MessageBubble({ message }: Props) {
    if (message.role === 'bot') {
        return (
            <motion.div
                className="flex gap-3 items-end"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
                    <Bot size={16} strokeWidth={1.5} />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm shadow-card border border-gray-100 px-4 py-3 text-gray-800 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap">
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
