import { pool } from '../db/client'
import { searchKnowledge } from './ragService'
import { checkLimit } from './limitsService'

export async function handleFreeChat(tenantId: string, sessionId: string, message: string): Promise<string | null> {
    console.log(`[ChatService] Starting free chat for tenant ${tenantId}, session ${sessionId}`);
    try {
        // 0. Check if session is human managed
        const sessionRes = await pool.query(
            `SELECT is_human_managed FROM sessions WHERE id = $1`,
            [sessionId]
        )
        if (sessionRes.rows[0]?.is_human_managed) {
            console.log(`[ChatService] Session is human managed, skipping AI`);
            return null
        }

        // 1. Fetch tenant bot settings, integrations and branding
        console.log(`[ChatService] Fetching settings for tenant ${tenantId}`);
        const res = await pool.query(
            `SELECT 
                b.bot_name, b.system_prompt_override, b.tone,
                i.routerai_api_key, i.routerai_primary_model,
                bh.trigger_words,
                br.contact_phone
             FROM tenant_bot_settings b
             JOIN tenant_integrations i ON b.tenant_id = i.tenant_id
             JOIN tenant_bot_behavior bh ON b.tenant_id = bh.tenant_id
             LEFT JOIN tenant_branding br ON b.tenant_id = br.tenant_id
             WHERE b.tenant_id = $1`,
            [tenantId]
        )

        const settings = res.rows[0]
        if (!settings || !settings.routerai_api_key) {
            console.warn(`[ChatService] Missing settings or API key for tenant ${tenantId}`);
            return 'К сожалению, я пока не могу отвечать на свободные вопросы. Пожалуйста, оставьте свои контакты, и менеджер свяжется с вами.'
        }

        const apiKey = settings.routerai_api_key
        let model = settings.routerai_primary_model || 'anthropic/claude-sonnet-4.6'
        console.log(`[ChatService] Using primary model from DB: ${settings.routerai_primary_model} (Final model: ${model})`);

        // Auto-fix missing prefixes for common models
        if (model === 'gpt-4o' || model === 'gpt-4o-mini' || model === 'gpt-5.2') {
            model = `openai/${model}`
        }

        const botName = settings.bot_name || 'Макс'
        const triggerWords: string[] = settings.trigger_words || ['дорого', 'не устраивает', 'менеджер']

        // 1.5 Detect Phone Number (Lead Capture in Free Chat)
        const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/
        const looksLikePhone = phoneRegex.test(message.trim()) || (message.trim().length >= 10 && /^\d+$/.test(message.trim().replace(/[\s\-\(\)\+]/g, '')))

        if (looksLikePhone) {
            console.log(`[ChatService] Phone number detected: ${message}`);
            try {
                // Save lead
                await pool.query(
                    `INSERT INTO leads (session_id, tenant_id, contact_type, contact_value)
                     VALUES ($1, $2, $3, $4)`,
                    [sessionId, tenantId, 'phone_chat', message.trim()]
                )

                // Update session
                const { updateSessionStatus, incrementTenantUsage } = await import('./sessionService')
                await updateSessionStatus(sessionId, 'converted')
                await incrementTenantUsage(tenantId, 'leads_count')

                // Notify Telegram
                const { sendTelegramNotification } = await import('./telegramService')
                await sendTelegramNotification(
                    `📱 <b>Новый контакт из свободного чата!</b>\n\n` +
                    `<b>Телефон:</b> <code>${message.trim()}</code>\n` +
                    `<b>Сессия:</b> <code>${sessionId}</code>`,
                    tenantId
                )

                return 'Благодарю за проявленный интерес! Менеджер свяжется с вами в ближайшие 30 минут.'
            } catch (err) {
                console.error('[ChatService] Failed to save lead from phone detection:', err);
                // Continue to LLM or fallback
            }
        }

        console.log(`[ChatService] Using model: ${model} for bot: ${botName}`);

        // 2. Check for trigger words (Escalation)
        const lowerMessage = message.toLowerCase()
        if (triggerWords.some(word => lowerMessage.includes(word.toLowerCase()))) {
            console.log(`[ChatService] Trigger word detected: ${message}`);
            return 'Понимаю. Давайте я передам ваш диалог нашему старшему специалисту, он скоро подключится и поможет вам.'
        }

        // 3. Retrieve Knowledge Context (RAG)
        console.log(`[ChatService] Searching RAG for: ${message.substring(0, 50)}...`);
        const context = await searchKnowledge(tenantId, message, 3)

        // 4. Construct System Prompt
        const contactPhone = settings.contact_phone || '+7 (999) 000-00-00'

        let basePrompt = settings.system_prompt_override ||
            `Ты - ИИ-эксперт по имени ${botName}, помогающий клиентам компании с ремонтом квартир.
Отвечай вежливо, профессионально и кратко.`

        // Context-aware instruction to avoid repeated greetings
        const convInstruction = `
ВАЖНО: Ты находишься в режиме продолжения диалога. Если диалог уже идет (есть история сообщений), НЕ здоровайся повторно (не говори "Привет", "Добрый день" и т.д.). Сразу переходи к сути ответа.`

        const mandatoryInstructions = `
ВАЖНО: Если пользователь выразил желание рассчитать стоимость ремонта, составить смету или узнать цену своего ремонта — ты должен СТРОГО ответить фразой: "Конечно! Давайте рассчитаем стоимость вашего ремонта. [TRIGGER_FUNNEL]". 
Никогда не пытайся проводить опрос самостоятельно, если ты включил [TRIGGER_FUNNEL]. Просто выдай эту фразу и остановись.

Если пользователь хочет связаться с менеджером, задать сложный вопрос или говорит, что ИИ не справляется:
1. Обязательно предложи позвонить по номеру: ${contactPhone}
2. Предложи пользователю просто написать свой номер телефона прямо здесь в чате, чтобы менеджер перезвонил ему в ближайшее время.`

        let systemPrompt = `${basePrompt}\n\n${convInstruction}\n\n${mandatoryInstructions}`

        // Try to fetch lead data (funnel answers) for context if available
        try {
            const leadRes = await pool.query(
                `SELECT apartment_params, selected_segment FROM leads WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [sessionId]
            )
            if (leadRes.rows.length > 0) {
                const lead = leadRes.rows[0]
                const p = lead.apartment_params || {}
                systemPrompt += `\n\nТЕКУЩИЙ КОНТЕКСТ ОБЪЕКТА ПОЛЬЗОВАТЕЛЯ:
- Площадь: ${p.area} м²
- Комнат: ${p.rooms}
- Тип ремонта: ${p.repairType}
- Дизайн-проект: ${p.design || 'Не указано'}
- Состояние: ${p.condition || 'Не указано'}
- Выбранный сегмент сметы: ${lead.selected_segment || 'Не выбран'}
Используй эти данные, если вопрос пользователя касается его конкретного объекта.`
            }
        } catch (err) {
            console.error('[ChatService] Error fetching lead context:', err)
        }

        if (context) {
            systemPrompt += `\n\nИспользуй следующую информацию из базы знаний компании для ответа на вопрос:\n"""\n${context}\n"""\nЕсли ответа нет в тексте выше, скажи, что нужно уточнить у менеджера.`
        } else {
            systemPrompt += `\n\nВ базе знаний нет релевантной информации по этому вопросу. Отвечай общими фактами или предложи связаться с менеджером.`
        }

        // 5. Fetch Chat History from DB (last 15 messages for context)
        console.log(`[ChatService] Fetching history for session ${sessionId}`);
        const historyRes = await pool.query(
            `SELECT role, content FROM messages 
             WHERE session_id = $1 
             ORDER BY created_at DESC LIMIT 15`,
            [sessionId]
        )
        const dbHistory = historyRes.rows.reverse()

        const messages = [
            { role: 'system', content: systemPrompt },
            ...dbHistory.map((m: any) => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.content
            })),
            { role: 'user', content: message }
        ]

        // 6. Check token limit before calling
        const limitCheck = await checkLimit(tenantId, 'tokens')
        if (!limitCheck.allowed) {
            console.warn(`[ChatService] Token limit reached for tenant ${tenantId}: ${limitCheck.reason}`);
            return `В данный момент невозможно обработать Ваш запрос из-за повышенной нагрузки на сервер. Свяжитесь с менеджером по номеру ${contactPhone}. Либо оставьте свой номер и мы Вам перезвоним 😊`
        }

        // 7. Call RouterAI Chat Completions
        const url = process.env.ROUTERAI_BASE_URL || 'https://routerai.ru/api/v1'
        console.log(`[ChatService] Calling RouterAI at ${url}/chat/completions`);
        const response = await fetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.3,
                max_tokens: 500
            })
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error(`[ChatService] LLM API Error (${response.status}):`, errText)
            return 'Извините, сейчас у меня небольшие технические неполадки. Менеджер ответит вам в ближайшее время.'
        }

        const data = await response.json() as any;
        console.log(`[ChatService] LLM response received`);

        // 8. Increment Tokens Used & Cost
        if (data.usage && (data.usage.total_tokens || data.usage.cost)) {
            try {
                const { incrementTenantUsage } = await import('./sessionService')
                if (data.usage.total_tokens) {
                    await incrementTenantUsage(tenantId, 'tokens_used', data.usage.total_tokens)
                    console.log(`[ChatService] Incremented ${data.usage.total_tokens} tokens`);
                }

                // OpenRouter/RouterAI specific: cost of the request
                const cost = data.usage.cost || data.cost;
                if (cost) {
                    await incrementTenantUsage(tenantId, 'tokens_cost', cost)
                    console.log(`[ChatService] Incremented cost: ${cost}`);
                }
            } catch (usageErr) {
                console.error('[ChatService] Failed to increment usage:', usageErr);
            }
        }

        const reply = data.choices?.[0]?.message?.content || 'Не смог сформулировать ответ.'
        return reply

    } catch (err: any) {
        console.error('[ChatService] Handle Free Chat Error:', err);
        return 'Ой, что-то пошло не так. Передаю вопрос менеджеру.'
    }
}
