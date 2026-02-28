import { pool } from '../db/client'
import { qdrantClient, COLLECTION_NAME } from './qdrantClient'
import crypto from 'crypto'

/**
 * Text chunking logic
 */
function chunkText(text: string, chunkSize: number = 800, overlap: number = 200): string[] {
    const chunks: string[] = []
    let i = 0
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize))
        i += chunkSize - overlap
    }
    return chunks
}

/**
 * Get tenant RouterAI api key
 */
async function getRouterApiKey(tenantId: string): Promise<string> {
    const res = await pool.query(
        `SELECT routerai_api_key FROM tenant_integrations WHERE tenant_id = $1`,
        [tenantId]
    )
    const apiKey = res.rows[0]?.routerai_api_key
    if (!apiKey) {
        throw new Error('RouterAI API key not configured for this tenant')
    }
    return apiKey
}

/**
 * Call RouterAI for embeddings
 */
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
    // Assuming RouterAI provides an OpenAI-compatible /v1/embeddings endpoint
    const url = process.env.ROUTERAI_BASE_URL || 'https://routerai.ru/api/v1'
    const response = await fetch(`${url}/embeddings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            input: text,
            model: 'openai/text-embedding-3-small' // Correct model ID for RouterAI
        })
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Embedding API error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
}

export async function addDocument(tenantId: string, text: string, fileName: string) {
    // 1. Get API Key
    const apiKey = await getRouterApiKey(tenantId)

    // 2. Save document record to DB
    const docId = crypto.randomUUID()
    await pool.query(
        `INSERT INTO tenant_knowledge_documents (id, tenant_id, file_name, content) VALUES ($1, $2, $3, $4)`,
        [docId, tenantId, fileName, text]
    )

    // 3. Chunk text
    const chunks = chunkText(text)

    // 4. Generate embeddings and store in Qdrant
    if (chunks.length > 0) {
        const points = []
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const vector = await getEmbedding(chunk, apiKey)
            points.push({
                id: crypto.randomUUID(),
                vector,
                payload: {
                    tenantId,
                    documentId: docId,
                    text: chunk,
                    chunkIndex: i
                }
            })
        }

        await qdrantClient.upsert(COLLECTION_NAME, {
            wait: true,
            points
        })
    }

    return docId
}

export async function searchKnowledge(tenantId: string, query: string, topK: number = 3): Promise<string> {
    try {
        const apiKey = await getRouterApiKey(tenantId)
        const queryVector = await getEmbedding(query, apiKey)

        const searchResult = await qdrantClient.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: topK,
            filter: {
                must: [{ key: 'tenantId', match: { value: tenantId } }]
            },
            with_payload: true,
        })

        if (!searchResult || searchResult.length === 0) {
            return ''
        }

        const contexts = searchResult
            .filter(r => (r.score ?? 0) > 0.3) // Minimum similarity threshold
            .map(r => r.payload?.text as string)

        return contexts.join('\n\n')
    } catch (e) {
        console.error('RAG Search Knowledge Error:', e)
        return ''
    }
}

export async function deleteDocument(tenantId: string, docId: string) {
    // Remove from DB
    await pool.query(
        `DELETE FROM tenant_knowledge_documents WHERE id = $1 AND tenant_id = $2`,
        [docId, tenantId]
    )

    // Remove from Qdrant
    await qdrantClient.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
            must: [
                { key: 'tenantId', match: { value: tenantId } },
                { key: 'documentId', match: { value: docId } }
            ]
        }
    })
}

export async function addQAPair(tenantId: string, question: string, answer: string) {
    const combinedText = `Вопрос: ${question}\nОтвет: ${answer}`
    return await addDocument(tenantId, combinedText, `QA_${Date.now()}.txt`)
}

export async function getKnowledgeDocuments(tenantId: string) {
    const res = await pool.query(
        `SELECT id, file_name, created_at FROM tenant_knowledge_documents WHERE tenant_id = $1 ORDER BY created_at DESC`,
        [tenantId]
    )
    return res.rows
}
