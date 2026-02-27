import { motion } from 'framer-motion'
import { Bot, Headset } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'

export default function TypingIndicator() {
    const isHumanManaged = useChatStore((s) => s.isHumanManaged)
    const managerIsTyping = useChatStore((s) => s.managerIsTyping)
    const isTyping = useChatStore((s) => s.isTyping)

    // Show indicator if bot is typing OR (takeover is active AND manager is typing)
    const active = isTyping || (isHumanManaged && managerIsTyping)
    if (!active) return null

    const Icon = isHumanManaged && managerIsTyping ? Headset : Bot
    const iconClass = isHumanManaged && managerIsTyping ? 'bg-secondary-50 text-secondary-500' : 'bg-primary-50 text-primary-500'

    return (
        <div className="flex gap-3 items-end">
            <div className={`w-8 h-8 rounded-full ${iconClass} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} strokeWidth={1.5} />
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
