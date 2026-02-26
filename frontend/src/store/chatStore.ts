import { create } from 'zustand'
import { Message, ChatState, FunnelAnswers } from '../types/chat'
import { FUNNEL_STEPS, WELCOME_MESSAGE } from '../config/funnel'
import { submitLead as submitLeadApi } from '../services/api'

interface ChatStore {
    isOpen: boolean
    chatState: ChatState
    messages: Message[]
    currentFunnelStep: number
    funnelAnswers: FunnelAnswers
    isTyping: boolean
    isBotMessageReady: boolean
    availableSegments: string[]
    sessionId: string | null
    estimateMin: number
    estimateMax: number
    openChat: (initialQuestion?: string) => void
    closeChat: () => void
    sendUserMessage: (text: string) => Promise<void>
    _addBotMessage: (text: string) => void
    submitLead: (contactType: string, contactValue: string) => Promise<void>
}

export const useChatStore = create<ChatStore>((set, get) => ({
    isOpen: false,
    chatState: 'IDLE',
    messages: [],
    currentFunnelStep: 0,
    funnelAnswers: {},
    isTyping: false,
    isBotMessageReady: false,
    availableSegments: [],
    sessionId: null,
    estimateMin: 0,
    estimateMax: 0,

    submitLead: async (contactType, contactValue) => {
        const { sessionId, funnelAnswers, estimateMin, estimateMax } = get()
        try {
            await submitLeadApi({
                sessionId: sessionId || 'anonymous',
                contactType,
                phone: contactValue,
                apartmentParams: funnelAnswers,
                selectedSegment: funnelAnswers.selectedSegment || '',
                estimateMin,
                estimateMax,
            })
        } catch (e) {
            console.error('Lead submit error:', e)
        }
    },

    _addBotMessage: (text: string) => {
        set({ isTyping: true, isBotMessageReady: false })
        setTimeout(() => {
            const msg: Message = {
                id: Date.now().toString(),
                role: 'bot',
                text,
                timestamp: Date.now(),
            }
            set((s) => ({ isTyping: false, isBotMessageReady: true, messages: [...s.messages, msg] }))
        }, 400)
    },

    openChat: (initialQuestion?: string) => {
        const newSessionId = crypto.randomUUID()
        set({
            isOpen: true,
            chatState: 'WELCOME',
            messages: [],
            funnelAnswers: {},
            currentFunnelStep: 0,
            sessionId: newSessionId,
        })
        get()._addBotMessage(WELCOME_MESSAGE)
        if (initialQuestion) {
            setTimeout(() => get().sendUserMessage(initialQuestion), 1200)
        }
    },

    closeChat: () => set({ isOpen: false }),

    sendUserMessage: async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: Date.now(),
        }
        set((s) => ({ messages: [...s.messages, userMsg], isBotMessageReady: false }))

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
                set({ chatState: 'CALCULATING' })
                setTimeout(() => _addBotMessage('Считаю смету...'), 800)
                setTimeout(() => {
                    const a = updatedAnswers
                    const area = parseFloat(a.area || '50')
                    const rooms = a.rooms || '?'
                    const repairType = a.repairType || 'Капитальный'
                    const design = a.design || 'Нет'

                    // Определяем сегменты и ставки (руб/м²)
                    type RateMap = Record<string, [number, number | null]>
                    let segments: string[]
                    let rates: RateMap

                    if (repairType === 'Косметический') {
                        segments = ['Эконом', 'Стандарт']
                        rates = {
                            'Эконом': [5000, 8000],
                            'Стандарт': [8000, 13000],
                        }
                    } else if (design === 'Нет') {
                        segments = ['Эконом', 'Стандарт']
                        rates = {
                            'Эконом': [17000, 25000],
                            'Стандарт': [25000, 35000],
                        }
                    } else if (design === 'Да, базовый') {
                        segments = ['Стандарт', 'Комфорт']
                        rates = {
                            'Стандарт': [25000, 35000],
                            'Комфорт': [35000, 50000],
                        }
                    } else {
                        segments = ['Стандарт', 'Комфорт', 'Премиум']
                        rates = {
                            'Стандарт': [25000, 35000],
                            'Комфорт': [35000, 50000],
                            'Премиум': [50000, null],
                        }
                    }

                    set({ availableSegments: segments })

                    const fmt = (n: number) =>
                        Math.round((n * area) / 1000).toLocaleString('ru-RU') + ' тр.'

                    const designLabel =
                        design === 'Да, базовый' ? 'с базовым дизайн-проектом' :
                            design === 'Да, полный' ? 'с полным дизайн-проектом' :
                                'без дизайн-проекта'

                    const repairLabel = repairType === 'Косметический'
                        ? 'косметический ремонт'
                        : 'капитальный ремонт'

                    const priceLines = segments.map(seg => {
                        const [min, max] = rates[seg]
                        if (max === null) return `— ${seg}: от ${fmt(min)}`
                        return `— ${seg}: ${fmt(min)} – ${fmt(max)}`
                    }).join('\n')

                    const resultText =
                        `Смотрите, в вашем случае ${repairLabel} ${rooms}-комнатной квартиры ${a.area} м², ` +
                        `${designLabel} будет стоить ориентировочно:\n\n${priceLines}\n\n` +
                        `Какой вариант больше подходит? Отправлю детальную смету 👇`

                    set({ chatState: 'SEGMENT_CHOICE' })

                    const minRates = segments.map(seg => rates[seg][0])
                    const maxRates = segments.map(seg => rates[seg][1]).filter((r): r is number => r !== null)
                    const rMin = Math.min(...minRates)
                    const rMax = maxRates.length > 0 ? Math.max(...maxRates) : rMin * 1.5
                    set({ estimateMin: area * rMin, estimateMax: area * rMax })

                    _addBotMessage(resultText)
                }, 2800)
            } else {
                set({ currentFunnelStep: nextIndex })
                setTimeout(() => _addBotMessage(FUNNEL_STEPS[nextIndex].question), 800)
            }
        }

        if (chatState === 'SEGMENT_CHOICE') {
            const updatedAnswers = { ...funnelAnswers, selectedSegment: text }
            set({ funnelAnswers: updatedAnswers, chatState: 'LEAD_CAPTURE' })
            setTimeout(() => {
                _addBotMessage(`Отлично! Отправлю смету в ${text}.\n\nОставьте ваш номер телефона — менеджер свяжется и пришлёт смету 👇`)
            }, 600)
        }

        if (chatState === 'LEAD_CAPTURE') {
            const updatedAnswers = { ...funnelAnswers, phone: text }
            set({ funnelAnswers: updatedAnswers })
            await get().submitLead('phone', text)
            set({ chatState: 'FREE_CHAT' })
            setTimeout(() => _addBotMessage(
                'Спасибо! Менеджер свяжется с вами в течение нескольких минут и пришлёт детальную смету.\n\nЕсли есть вопросы по ремонту — с удовольствием отвечу 😊'
            ), 600)
            return
        }

        if (chatState === 'FREE_CHAT') {
            setTimeout(() => _addBotMessage(
                'Пока я работаю в демо-режиме, но скоро смогу отвечать на любые ваши вопросы по ремонту!'
            ), 1000)
            return
        }
    },
}))
