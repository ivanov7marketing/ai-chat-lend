import { create } from 'zustand'
import { Message, ChatState, FunnelAnswers } from '../types/chat'
import { FUNNEL_STEPS, WELCOME_MESSAGE } from '../config/funnel'

interface ChatStore {
    isOpen: boolean
    chatState: ChatState
    messages: Message[]
    currentFunnelStep: number
    funnelAnswers: FunnelAnswers
    isTyping: boolean
    openChat: (initialQuestion?: string) => void
    closeChat: () => void
    sendUserMessage: (text: string) => void
    _addBotMessage: (text: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
    isOpen: false,
    chatState: 'IDLE',
    messages: [],
    currentFunnelStep: 0,
    funnelAnswers: {},
    isTyping: false,

    _addBotMessage: (text: string) => {
        set({ isTyping: true })
        setTimeout(() => {
            const msg: Message = {
                id: Date.now().toString(),
                role: 'bot',
                text,
                timestamp: Date.now(),
            }
            set((s) => ({ isTyping: false, messages: [...s.messages, msg] }))
        }, 400)
    },

    openChat: (initialQuestion?: string) => {
        set({
            isOpen: true,
            chatState: 'WELCOME',
            messages: [],
            funnelAnswers: {},
            currentFunnelStep: 0,
        })
        get()._addBotMessage(WELCOME_MESSAGE)
        if (initialQuestion) {
            setTimeout(() => get().sendUserMessage(initialQuestion), 1200)
        }
    },

    closeChat: () => set({ isOpen: false }),

    sendUserMessage: (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: Date.now(),
        }
        set((s) => ({ messages: [...s.messages, userMsg] }))

        const { chatState, currentFunnelStep, funnelAnswers, _addBotMessage } = get()

        if (chatState === 'WELCOME') {
            if (text.startsWith('🧮')) {
                set({ chatState: 'FUNNEL', currentFunnelStep: 0 })
                setTimeout(() => {
                    _addBotMessage(FUNNEL_STEPS[0].question)
                }, 800)
            } else {
                setTimeout(() => {
                    _addBotMessage('Понял! Давайте сначала рассчитаем стоимость — это займёт 1 минуту.\n\nНажмите «🧮 Рассчитать стоимость ремонта» чтобы начать.')
                }, 800)
            }
            return
        }

        if (chatState === 'FUNNEL') {
            const step = FUNNEL_STEPS[currentFunnelStep]
            const updatedAnswers: FunnelAnswers = { ...funnelAnswers, [step.id]: text }
            set({ funnelAnswers: updatedAnswers })

            // Найти следующий шаг с учётом пропуска
            const getNextStepIndex = (fromIndex: number, answers: FunnelAnswers): number | null => {
                let next = fromIndex + 1
                while (next < FUNNEL_STEPS.length) {
                    const nextStep = FUNNEL_STEPS[next]
                    if (nextStep.skipIf) {
                        const { stepId, value } = nextStep.skipIf
                        if (answers[stepId as keyof FunnelAnswers] === value) {
                            next++
                            continue
                        }
                    }
                    return next
                }
                return null
            }

            const nextIndex = getNextStepIndex(currentFunnelStep, updatedAnswers)

            if (nextIndex === null) {
                // Воронка завершена
                set({ chatState: 'CALCULATING' })
                setTimeout(() => _addBotMessage('Считаю смету...'), 800)
                setTimeout(() => {
                    const a = updatedAnswers
                    const area = parseFloat(a.area || '50')
                    const segmentRates: Record<string, [number, number]> = {
                        'Эконом': [25000, 35000],
                        'Стандарт': [35000, 50000],
                        'Комфорт': [50000, 75000],
                        'Премиум': [75000, 120000],
                    }
                    const [rMin, rMax] = segmentRates[a.segment || 'Стандарт'] || [35000, 50000]
                    const min = (area * rMin).toLocaleString('ru-RU')
                    const max = (area * rMax).toLocaleString('ru-RU')
                    const resultText = `✅ Готово! Предварительная оценка:\n\n📋 Квартира ${a.rooms || '?'}-комн., ${a.area} м², ${a.segment || 'Стандарт'} класс\n\n💰 Стоимость ремонта: от ${min} до ${max} руб.\n\nЭто предварительная оценка. Для точной сметы нужен замер.\n\n📄 Хотите получить детальную смету в PDF?\nКуда отправить?`
                    set({ chatState: 'LEAD_CAPTURE' })
                    _addBotMessage(resultText)
                }, 2800)
            } else {
                set({ currentFunnelStep: nextIndex })
                setTimeout(() => _addBotMessage(FUNNEL_STEPS[nextIndex].question), 800)
            }
        }
    },
}))
