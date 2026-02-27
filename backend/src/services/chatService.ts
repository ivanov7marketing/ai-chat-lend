import { pool } from '../db/client'
import { searchKnowledge } from './ragService'

export async function handleFreeChat(tenantId: string, sessionId: string, message: string): Promise<string> {
    try {
        // 1. Fetch tenant bot settings and integrations
        const res = await pool.query(
            `SELECT 
                b.bot_name, b.system_prompt_override, b.tone,
                i.routerai_api_key, i.routerai_primary_model,
                bh.trigger_words
             FROM tenant_bot_settings b
             JOIN tenant_integrations i ON b.tenant_id = i.tenant_id
             JOIN tenant_bot_behavior bh ON b.tenant_id = bh.tenant_id
             WHERE b.tenant_id = $1`,
            [tenantId]
        )

        const settings = res.rows[0]
        if (!settings || !settings.routerai_api_key) {
            return 'К сожалению, я пока не могу отвечать на свободные вопросы. Пожалуйста, оставьте свои контакты, и менеджер свяжется с вами.'
        }

        const apiKey = settings.routerai_api_key
        const model = settings.routerai_primary_model || 'gpt-4o'
        const botName = settings.bot_name || 'Макс'
        const triggerWords: string[] = settings.trigger_words || ['дорого', 'не устраивает', 'менеджер']

        // 2. Check for trigger words (Escalation)
        const lowerMessage = message.toLowerCase()
        if (triggerWords.some(word => lowerMessage.includes(word.toLowerCase()))) {
            return 'Понимаю. Давайте я передам ваш диалог нашему старшему специалисту, он скоро подключится и поможет вам.'
        }

        // 3. Retrieve Knowledge Context (RAG)
        const context = await searchKnowledge(tenantId, message, 3)

        // 4. Construct System Prompt
        let systemPrompt = settings.system_prompt_override ||
            `Ты - ИИ-эксперт по имени ${botName}, помогающий клиентам компании с ремонтом квартир.
Отвечай вежливо, профессионально и кратко.`

        if (context) {
            systemPrompt += `\n\nИспользуй следующую информацию из базы знаний компании для ответа на вопрос:\n"""\n${context}\n"""\nЕсли ответа нет в тексте выше, скажи, что нужно уточнить у менеджера.`
        } else {
            systemPrompt += `\n\nВ базе знаний нет релевантной информации по этому вопросу. Отвечай общими фактами или предложи связаться с менеджером.`
        }

        // 5. Fetch Chat History from DB (last 5 messages for context)
        const historyRes = await pool.query(
            `SELECT role, content FROM messages 
             WHERE session_id = $1 
             ORDER BY created_at DESC LIMIT 5`,
            [sessionId]
        )
        const dbHistory = historyRes.rows.reverse()

        const messages = [
            { role: 'system', content: systemPrompt },
            ...dbHistory.map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user', // Map our 'bot' to OpenAI 'assistant'
                content: m.content
            })),
            { role: 'user', content: message }
        ]

        // 6. Call RouterAI Chat Completions
        const url = process.env.ROUTERAI_BASE_URL || 'https://api.routerai.ru/v1'
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
            console.error('LLM API Error:', errText)
            return 'Извините, сейчас у меня небольшие технические неполадки. Менеджер ответит вам в ближайшее время.'
        }

        const data = await response.json()
        const reply = data.choices?.[0]?.message?.content || 'Не смог сформулировать ответ.'
        return reply

    } catch (err) {
        console.error('Handle Free Chat Error:', err)
        return 'Ой, что-то пошло не так. Передаю вопрос менеджеру.'
    }
}
