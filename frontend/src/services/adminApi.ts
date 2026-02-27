import type {
    DashboardMetrics,
    DialogSession,
    DialogDetailData,
    DialogRating,
    DialogFilters,
    PriceRecord,
    NewWorkType,
    BotPersonality,
    RepairSegment,
    BotBehavior,
    KnowledgeDocument,
    KnowledgeArticle,
    KnowledgeGap,
    IntegrationSettings,
} from '../types/admin';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

function getToken(): string {
    return localStorage.getItem('auth_token') || ''
}

function getAdminBase(slug?: string): string {
    const s = slug || localStorage.getItem('auth_slug') || ''
    return s ? `/api/t/${s}/admin` : '/api/admin'
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const token = getToken()
    const res = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
}

// ============ Dashboard ============

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
        return await apiFetch<DashboardMetrics>(`${getAdminBase()}/dashboard/metrics`);
    } catch {
        return {
            totalVisits: 0,
            chatOpened: 0,
            estimateStarted: 0,
            estimateCompleted: 0,
            leadsCreated: 0,
            conversionRate: 0,
            avgDialogDuration: '—',
        };
    }
}

// ============ Dialogs ============

export async function getDialogs(
    filters: DialogFilters,
    limit = 20,
    offset = 0
): Promise<{ data: DialogSession[]; total: number }> {
    const res = await apiFetch<{ data: DialogSession[]; total: number }>(
        `${getAdminBase()}/dialogs?limit=${limit}&offset=${offset}`
    );
    let filtered = res.data;

    if (filters.status !== 'all') {
        filtered = filtered.filter((d) =>
            filters.status === 'converted'
                ? d.status === 'converted'
                : filters.status === 'active'
                    ? d.status === 'active'
                    : d.status !== 'active' && d.status !== 'converted'
        );
    }

    if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
            (d) =>
                d.id.toLowerCase().includes(q) ||
                d.phone?.toLowerCase().includes(q) ||
                d.utm_source?.toLowerCase().includes(q)
        );
    }

    return { data: filtered, total: res.total };
}

export async function getDialogDetail(
    id: string
): Promise<DialogDetailData | null> {
    try {
        return await apiFetch<DialogDetailData>(`${getAdminBase()}/dialogs/${id}`);
    } catch {
        return null;
    }
}

export async function updateDialogRating(
    id: string,
    rating: DialogRating
): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/dialogs/${id}/rating`, {
        method: 'PUT',
        body: JSON.stringify({ rating }),
    });
}

// ============ Prices ============

export async function getPrices(): Promise<PriceRecord[]> {
    return apiFetch<PriceRecord[]>(`${getAdminBase()}/prices`);
}

export async function updatePrices(
    updates: { workTypeId: number; segment: string; priceMin: number; priceMax: number }[]
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`${getAdminBase()}/prices`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function addWorkType(
    data: NewWorkType
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`${getAdminBase()}/prices`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ============ Bot Personality ============

export async function getBotPersonality(): Promise<BotPersonality> {
    return apiFetch<BotPersonality>(`${getAdminBase()}/bot/personality`);
}

export async function updateBotPersonality(
    data: BotPersonality
): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/bot/personality`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ============ Bot Segments ============

export async function getBotSegments(): Promise<RepairSegment[]> {
    return apiFetch<RepairSegment[]>(`${getAdminBase()}/bot/segments`);
}

export async function updateBotSegment(
    segment: RepairSegment
): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/bot/segments/${segment.id}`, {
        method: 'PUT',
        body: JSON.stringify(segment),
    });
}

// ============ Bot Behavior ============

export async function getBotBehavior(): Promise<BotBehavior> {
    return apiFetch<BotBehavior>(`${getAdminBase()}/bot/behavior`);
}

export async function updateBotBehavior(data: BotBehavior): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/bot/behavior`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ============ Knowledge Base ============

const MOCK_ARTICLES: KnowledgeArticle[] = [
    {
        id: 1,
        title: 'Сколько длится ремонт под ключ двухкомнатной квартиры?',
        content: 'Средний срок ремонта двухкомнатной квартиры составляет 2-4 месяца в зависимости от сложности работ и выбранного сегмента.',
        keywords: ['сроки', 'двушка', 'ремонт под ключ'],
        createdAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 2,
        title: 'Какие гарантии даёт компания?',
        content: 'Мы даём гарантию 3 года на все виды работ. Гарантия распространяется на качество выполненных работ и используемые материалы.',
        keywords: ['гарантия', 'качество'],
        createdAt: '2026-02-05T10:00:00Z',
    },
];

const MOCK_GAPS: KnowledgeGap[] = [
    { id: 1, question: 'Можно ли сделать ремонт в ипотечной квартире?', sessionId: 'abc-123', createdAt: '2026-02-22T16:00:00Z', count: 7 },
    { id: 2, question: 'Работаете ли вы с материнским капиталом?', sessionId: 'def-456', createdAt: '2026-02-23T10:00:00Z', count: 4 },
    { id: 3, question: 'Есть ли рассрочка на ремонт?', sessionId: 'ghi-789', createdAt: '2026-02-24T14:00:00Z', count: 12 },
];

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
    const rawDocs = await apiFetch<any[]>(`${getAdminBase()}/bot/knowledge`);
    return rawDocs.map(d => ({
        id: d.id,
        filename: d.file_name,
        uploadedAt: d.created_at,
        sizeBytes: d.content ? d.content.length : 0, // Fallback, the endpoint doesn't return size currently
        status: 'ready'
    }));
}

export async function uploadDocument(
    file: File
): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                await apiFetch<{ success: boolean }>(`${getAdminBase()}/bot/knowledge/upload`, {
                    method: 'POST',
                    body: JSON.stringify({ text, fileName: file.name })
                });
                resolve({ success: true });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export async function deleteDocument(id: number | string): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/bot/knowledge/${id}`, {
        method: 'DELETE'
    });
}

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return [...MOCK_ARTICLES];
}

export async function getKnowledgeGaps(): Promise<KnowledgeGap[]> {
    return [...MOCK_GAPS];
}

// ============ Integrations ============

export async function getIntegrations(): Promise<IntegrationSettings> {
    return apiFetch<IntegrationSettings>(`${getAdminBase()}/integrations`);
}

export async function updateIntegration(
    service: string,
    data: unknown
): Promise<void> {
    await apiFetch<{ success: boolean }>(`${getAdminBase()}/integrations/${service}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function testIntegration(
    service: string
): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(
        `${getAdminBase()}/integrations/${service}/test`,
        { method: 'POST' }
    );
}
