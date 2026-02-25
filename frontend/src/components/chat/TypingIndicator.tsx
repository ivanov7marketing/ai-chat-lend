import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export default function TypingIndicator() {
    return (
        <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
                <Bot size={16} strokeWidth={1.5} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-card border border-gray-100 px-4 py-3 flex gap-1.5 items-center">
                {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, delay, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}
            </div>
        </div>
    )
}
