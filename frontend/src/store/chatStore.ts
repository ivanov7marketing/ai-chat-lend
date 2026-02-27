import { create } from 'zustand'
import { Message, ChatState, FunnelAnswers } from '../types/chat'
import { FUNNEL_STEPS, WELCOME_MESSAGE } from '../config/funnel'
import { submitLead as submitLeadApi } from '../services/api'
import { reachGoal } from '../services/metrika'
import type { TenantSegment } from '../types/auth'

export interface TenantChatConfig {
    botName: string
    avatarUrl: string | null
    welcomeMessage: string
    quickButtons: any[]
    segments: TenantSegment[]
    funnelSteps: any[] | null
    integrations?: {
        yandexMetrika?: {
            counterId: string
            events?: Record<string, boolean>
        }
    }
}

interface ChatStore {
    isOpen: boolean
    chatState: ChatState
    messages: Message[]
    currentFunnelStep: number
    funnelAnswers: FunnelAnswers
    isTyping: boolean
    isBotMessageReady: boolean
    isHumanManaged: boolean
    availableSegments: string[]
    sessionId: string | null
    estimateMin: number
    estimateMax: number
    tenantSlug: string | null
    tenantConfig: TenantChatConfig | null
    openChat: (initialQuestion?: string) => void
    closeChat: () => void
    sendUserMessage: (text: string) => Promise<void>
    _addBotMessage: (text: string) => void
    submitLead: (contactType: string, contactValue: string) => Promise<void>
    setTenantSlug: (slug: string) => void
    setTenantConfig: (config: TenantChatConfig) => void
    socket: WebSocket | null
    connectWebSocket: () => void
}

// Default hardcoded rates as fallback when tenant config is not available
const DEFAULT_RATES: Record<string, Record<string, [number, number | null]>> = {
    cosmetic: {
        'Эконом': [5000, 8000],
        'Стандарт': [8000, 13000],
    },
    capitalNo: {
        'Эконом': [17000, 25000],
        'Стандарт': [25000, 35000],
    },
    capitalBasic: {
        'Стандарт': [25000, 35000],
        'Комфорт': [35000, 50000],
    },
    capitalFull: {
        'Стандарт': [25000, 35000],
        'Комфорт': [35000, 50000],
        'Премиум': [50000, null],
    },
}

export const useChatStore = create<ChatStore>((set, get) => ({
    isOpen: false,
    chatState: 'IDLE',
    messages: [],
    currentFunnelStep: 0,
    funnelAnswers: {},
    isTyping: false,
    isBotMessageReady: false,
    isHumanManaged: false,
    availableSegments: [],
    sessionId: null,
    estimateMin: 0,
    estimateMax: 0,
    tenantSlug: null,
    tenantConfig: null,
    socket: null,

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

    setTenantSlug: (slug: string) => {
        set({ tenantSlug: slug })
    },

    setTenantConfig: (config: TenantChatConfig) => {
        set({ tenantConfig: config })
    },

    connectWebSocket: () => {
        const { tenantSlug } = get()
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const host = window.location.host
        const slug = tenantSlug || 'default'
        const socket = new WebSocket(`${proto}://${host}/ws/${slug}`)

        socket.onopen = () => {
            console.log('WebSocket connected')
        }

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === 'session_created') {
                    set({ sessionId: data.sessionId })
                } else if (data.type === 'takeover_active') {
                    set({ isHumanManaged: true })
                } else if (data.type === 'message' && data.role === 'manager') {
                    const msg: Message = {
                        id: data.id || Date.now().toString(),
                        role: 'manager',
                        text: data.content,
                        timestamp: Date.now(),
                    }
                    set((s) => ({ messages: [...s.messages, msg], isTyping: false }))
                }
            } catch (e) {
                console.error('WebSocket receive error:', e)
            }
        }

        socket.onclose = () => {
            console.log('WebSocket disconnected')
            set({ socket: null })
        }

        set({ socket })
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

            const { socket } = get()
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'message',
                    role: 'bot',
                    content: text,
                    id: msg.id
                }))
            }
        }, 400)
    },

    openChat: (initialQuestion?: string) => {
        const { tenantConfig } = get()
        const welcomeMsg = tenantConfig?.welcomeMessage || WELCOME_MESSAGE

        set({
            isOpen: true,
            chatState: 'WELCOME',
            messages: [],
            funnelAnswers: {},
            currentFunnelStep: 0,
            sessionId: null, // Will be set by WebSocket
            isHumanManaged: false,
        })
        get().connectWebSocket()
        get()._addBotMessage(welcomeMsg)

        reachGoal(
            tenantConfig?.integrations?.yandexMetrika?.counterId,
            'chat_opened',
            tenantConfig?.integrations?.yandexMetrika?.events
        )

        if (initialQuestion) {
            setTimeout(() => get().sendUserMessage(initialQuestion), 1200)
        }
    },

    closeChat: () => {
        const { socket } = get()
        if (socket) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'session_close' }))
            }
            socket.close()
        }
        set({ isOpen: false, socket: null })
    },

    sendUserMessage: async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: Date.now(),
        }
        set((s) => ({ messages: [...s.messages, userMsg], isBotMessageReady: false }))

        const { chatState, currentFunnelStep, funnelAnswers, _addBotMessage, socket, tenantConfig } = get()
        const funnelSteps = tenantConfig?.funnelSteps || FUNNEL_STEPS

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                role: 'user',
                content: text,
                id: userMsg.id
            }))
        }

        if (chatState === 'WELCOME') {
            if (text.startsWith('🧮')) {
                set({ chatState: 'FUNNEL', currentFunnelStep: 0, isBotMessageReady: false })
                reachGoal(
                    tenantConfig?.integrations?.yandexMetrika?.counterId,
                    'estimate_started',
                    tenantConfig?.integrations?.yandexMetrika?.events
                )
                setTimeout(() => {
                    _addBotMessage(funnelSteps[0].question)
                }, 800)
            } else {
                setTimeout(() => {
                    _addBotMessage('Понял! Давайте сначала рассчитаем стоимость — это займёт 1 минуту.\n\nНажмите «🧮 Рассчитать стоимость ремонта» чтобы начать.')
                }, 800)
            }
            return
        }

        if (chatState === 'FUNNEL') {
            const step = funnelSteps[currentFunnelStep]
            const updatedAnswers: FunnelAnswers = { ...funnelAnswers, [step.id]: text }
            set({ funnelAnswers: updatedAnswers })

            const getNextStepIndex = (fromIndex: number, answers: FunnelAnswers): number | null => {
                let next = fromIndex + 1
                while (next < funnelSteps.length) {
                    const nextStep = funnelSteps[next]
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

                    // Determine which segments to show based on repairType/design
                    let segmentNames: string[]
                    type RateMap = Record<string, [number, number | null]>
                    let rates: RateMap

                    if (repairType === 'Косметический') {
                        segmentNames = ['Эконом', 'Стандарт']
                    } else if (design === 'Нет') {
                        segmentNames = ['Эконом', 'Стандарт']
                    } else if (design === 'Да, базовый') {
                        segmentNames = ['Стандарт', 'Комфорт']
                    } else {
                        segmentNames = ['Стандарт', 'Комфорт', 'Премиум']
                    }

                    // Use tenant segments if available, otherwise fallback to hardcoded rates
                    if (tenantConfig?.segments && tenantConfig.segments.length > 0) {
                        const tenantSegMap: RateMap = {}
                        for (const seg of tenantConfig.segments) {
                            tenantSegMap[seg.name] = [seg.priceRangeMin, seg.priceRangeMax]
                        }
                        // Filter to only segments that exist in tenant config
                        const validNames = segmentNames.filter(n => n in tenantSegMap)
                        if (validNames.length > 0) {
                            segmentNames = validNames
                            rates = tenantSegMap
                        } else {
                            rates = _getFallbackRates(repairType, design)
                        }
                    } else {
                        rates = _getFallbackRates(repairType, design)
                    }

                    set({ availableSegments: segmentNames })

                    const fmt = (n: number) =>
                        Math.round((n * area) / 1000).toLocaleString('ru-RU') + ' тр.'

                    const designLabel =
                        design === 'Да, базовый' ? 'с базовым дизайн-проектом' :
                            design === 'Да, полный' ? 'с полным дизайн-проектом' :
                                'без дизайн-проекта'

                    const repairLabel = repairType === 'Косметический'
                        ? 'косметический ремонт'
                        : 'капитальный ремонт'

                    const priceLines = segmentNames.map(seg => {
                        const rate = rates[seg]
                        if (!rate) return `— ${seg}: уточняйте`
                        const [min, max] = rate
                        if (max === null) return `— ${seg}: от ${fmt(min)}`
                        return `— ${seg}: ${fmt(min)} – ${fmt(max)}`
                    }).join('\n')

                    const resultText =
                        `Смотрите, в вашем случае ${repairLabel} ${rooms}-комнатной квартиры ${a.area} м², ` +
                        `${designLabel} будет стоить ориентировочно:\n\n${priceLines}\n\n` +
                        `Какой вариант больше подходит? Отправлю детальную смету 👇`

                    set({ chatState: 'SEGMENT_CHOICE' })
                    reachGoal(
                        tenantConfig?.integrations?.yandexMetrika?.counterId,
                        'estimate_completed',
                        tenantConfig?.integrations?.yandexMetrika?.events
                    )

                    const minRates = segmentNames.map(seg => rates[seg]?.[0] ?? 0).filter(r => r > 0)
                    const maxRates = segmentNames.map(seg => rates[seg]?.[1]).filter((r): r is number => r !== null)
                    const rMin = minRates.length > 0 ? Math.min(...minRates) : 0
                    const rMax = maxRates.length > 0 ? Math.max(...maxRates) : rMin * 1.5
                    set({ estimateMin: area * rMin, estimateMax: area * rMax })

                    _addBotMessage(resultText)
                }, 2800)
            } else {
                set({ currentFunnelStep: nextIndex, isBotMessageReady: false })
                setTimeout(() => _addBotMessage(funnelSteps[nextIndex].question), 800)
            }
            return
        }

        if (chatState === 'SEGMENT_CHOICE') {
            const updatedAnswers = { ...funnelAnswers, selectedSegment: text }
            set({ funnelAnswers: updatedAnswers, chatState: 'LEAD_CAPTURE', isBotMessageReady: false })
            setTimeout(() => {
                _addBotMessage(`Отлично! Отправлю смету в ${text}.\n\nОставьте ваш номер телефона — менеджер свяжется и пришлёт смету 👇`)
            }, 600)
            return
        }

        if (chatState === 'LEAD_CAPTURE') {
            const updatedAnswers = { ...funnelAnswers, phone: text }
            set({ funnelAnswers: updatedAnswers })
            await get().submitLead('phone', text)
            reachGoal(
                tenantConfig?.integrations?.yandexMetrika?.counterId,
                'lead_created',
                tenantConfig?.integrations?.yandexMetrika?.events
            )
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

/** Helper: get fallback hardcoded rates based on repair type and design */
function _getFallbackRates(repairType: string, design: string): Record<string, [number, number | null]> {
    if (repairType === 'Косметический') return DEFAULT_RATES.cosmetic
    if (design === 'Нет') return DEFAULT_RATES.capitalNo
    if (design === 'Да, базовый') return DEFAULT_RATES.capitalBasic
    return DEFAULT_RATES.capitalFull
}
