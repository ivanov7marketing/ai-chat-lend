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
    // TODO: replace with real endpoint GET /api/admin/dashboard/metrics
    try {
        const data = await apiFetch<{ data: DialogSession[]; total: number }>(
            `${getAdminBase()}/dialogs?limit=10000`
        );
        const sessions = data.data || [];
        const leads = sessions.filter((s) => s.status === 'converted');
        return {
            totalVisits: data.total,
            chatOpened: sessions.length,
            estimateStarted: Math.round(sessions.length * 0.7),
            estimateCompleted: Math.round(sessions.length * 0.5),
            leadsCreated: leads.length,
            conversionRate: sessions.length
                ? Math.round((leads.length / sessions.length) * 100)
                : 0,
            avgDialogDuration: '4 мин 32 сек',
        };
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
        return await apiFetch<DialogDetailData>(`${getAdminBase()}/dialog/${id}`);
    } catch {
        return null;
    }
}

export async function updateDialogRating(
    id: string,
    rating: DialogRating
): Promise<void> {
    // TODO: implement backend PUT /api/admin/dialogs/:id/rating
    console.log(`[mock] Rating dialog ${id} as ${rating}`);
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
    // TODO: implement backend POST /api/admin/prices
    console.log('[mock] Adding work type:', data);
    return { success: true };
}

// ============ Bot Personality ============

const MOCK_PERSONALITY: BotPersonality = {
    name: 'Макс',
    tone: 'friendly',
    language: 'ru',
    welcomeMessage:
        'Привет! Я Макс — AI-эксперт по ремонту квартир в Челябинске.\nПомогу рассчитать примерную стоимость ремонта, расскажу о технологиях\nи отвечу на любые вопросы.\n\nС чего начнём?',
    quickButtons: [
        { id: '1', text: 'Рассчитать стоимость ремонта', emoji: '🧮', action: 'start_funnel' },
        { id: '2', text: 'Узнать сроки ремонта', emoji: '📅', action: 'ask_kb' },
        { id: '3', text: 'О компании и гарантиях', emoji: '🏢', action: 'ask_kb' },
        { id: '4', text: 'Советы по ремонту', emoji: '💡', action: 'ask_kb' },
        { id: '5', text: 'Задать свой вопрос', emoji: '❓', action: 'custom' },
    ],
};

export async function getBotPersonality(): Promise<BotPersonality> {
    // TODO: GET /api/admin/bot/personality
    return { ...MOCK_PERSONALITY };
}

export async function updateBotPersonality(
    data: BotPersonality
): Promise<void> {
    // TODO: PUT /api/admin/bot/personality
    console.log('[mock] Updating bot personality:', data);
}

// ============ Bot Segments ============

const MOCK_SEGMENTS: RepairSegment[] = [
    {
        id: 1,
        name: 'Эконом',
        description: 'Базовый ремонт с сертифицированными материалами эконом-класса. Простые решения без архитектурных изысков.',
        whatIncluded: '- Штукатурка/шпаклёвка стен\n- Покраска или обои\n- Ламинат 32 класс\n- Сантехника и электрика стандарт',
        priceRangeMin: 15000,
        priceRangeMax: 22000,
        typicalMaterials: 'Knauf, Ceresit CT127, Tarkett',
    },
    {
        id: 2,
        name: 'Стандарт',
        description: 'Качественный ремонт с оптимальным соотношением цены и результата.',
        whatIncluded: '- Выравнивание стен по маякам\n- Декоративная штукатурка / обои под покраску\n- Ламинат 33 класс / керамогранит\n- Натяжные потолки\n- Электрика с автоматами ABB',
        priceRangeMin: 22000,
        priceRangeMax: 35000,
        typicalMaterials: 'Knauf, Weber Vetonit, Quick-Step, Grohe',
    },
    {
        id: 3,
        name: 'Комфорт',
        description: 'Ремонт повышенного качества с дизайнерскими решениями и премиальными материалами среднего сегмента.',
        whatIncluded: '- Дизайн-проект (базовый)\n- Выравнивание стен и пола\n- Паркетная доска / плитка Kerama Marazzi\n- Многоуровневые потолки\n- Скрытая электрика\n- Сантехника Hansgrohe',
        priceRangeMin: 35000,
        priceRangeMax: 55000,
        typicalMaterials: 'Kerama Marazzi, Hansgrohe, Quick-Step Impressive',
    },
    {
        id: 4,
        name: 'Премиум',
        description: 'Эксклюзивный ремонт с полным дизайн-проектом, авторским надзором и топовыми материалами.',
        whatIncluded: '- Полный дизайн-проект + авторский надзор\n- Перепланировка (при необходимости)\n- Штучный паркет / мрамор\n- Умный дом (базовый)\n- Встроенная мебель по проекту\n- Премиальная сантехника Duravit / Villeroy & Boch',
        priceRangeMin: 55000,
        priceRangeMax: 100000,
        typicalMaterials: 'Duravit, Villeroy & Boch, Rimadesio, Laufen',
    },
];

export async function getBotSegments(): Promise<RepairSegment[]> {
    // TODO: GET /api/admin/bot/segments
    return [...MOCK_SEGMENTS];
}

export async function updateBotSegment(
    segment: RepairSegment
): Promise<void> {
    // TODO: PUT /api/admin/bot/segments/:id
    console.log('[mock] Updating segment:', segment);
}

// ============ Bot Behavior ============

const MOCK_BEHAVIOR: BotBehavior = {
    triggerWords: ['дорого', 'не устраивает', 'хочу говорить с человеком', 'менеджер', 'сомневаюсь'],
    maxMessagesWithoutCta: 5,
    estimateDisclaimer:
        'Данная смета является ориентировочной. Точная стоимость определяется после бесплатного замера. Не является публичной офертой.',
    pdfTtlNotice:
        'Внимание: ссылка на PDF активна 72 часа. Сохраните файл, если понадобится позже.',
};

export async function getBotBehavior(): Promise<BotBehavior> {
    // TODO: GET /api/admin/bot/behavior
    return { ...MOCK_BEHAVIOR };
}

export async function updateBotBehavior(data: BotBehavior): Promise<void> {
    // TODO: PUT /api/admin/bot/behavior
    console.log('[mock] Updating bot behavior:', data);
}

// ============ Knowledge Base ============

const MOCK_DOCUMENTS: KnowledgeDocument[] = [
    { id: 1, filename: 'Прайс-лист 2026.pdf', uploadedAt: '2026-02-10T12:00:00Z', sizeBytes: 2400000, status: 'ready' },
    { id: 2, filename: 'Гарантийные условия.docx', uploadedAt: '2026-02-15T09:30:00Z', sizeBytes: 450000, status: 'ready' },
    { id: 3, filename: 'СНиП ремонт.txt', uploadedAt: '2026-02-20T14:00:00Z', sizeBytes: 120000, status: 'indexing' },
];

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
    // TODO: GET /api/admin/bot/knowledge_base
    return [...MOCK_DOCUMENTS];
}

export async function uploadDocument(
    _file: File
): Promise<{ success: boolean }> {
    // TODO: POST /api/admin/bot/knowledge_base/upload
    console.log('[mock] Uploading document');
    return { success: true };
}

export async function deleteDocument(_id: number): Promise<void> {
    // TODO: DELETE /api/admin/bot/knowledge_base/:id
    console.log('[mock] Deleting document', _id);
}

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return [...MOCK_ARTICLES];
}

export async function getKnowledgeGaps(): Promise<KnowledgeGap[]> {
    return [...MOCK_GAPS];
}

// ============ Integrations ============

const MOCK_INTEGRATIONS: IntegrationSettings = {
    routerAI: {
        apiKey: 'sk-••••••••••••••••',
        primaryModel: 'gpt-4o',
        fallbackModel: 'claude-3-5-sonnet',
        dailyTokenLimit: 1000000,
        currentMonthUsage: 345200,
        currentMonthCost: 2340,
    },
    telegram: {
        botToken: '••••••••••:•••••••••••••••••••••',
        chatId: '',
        notificationTemplate:
            '🆕 Новый лид!\n\n👤 Контакт: {contact}\n🏠 Квартира: {area} м², {rooms}-комнатная\n🔧 Тип: {type}, сегмент: {segment}\n💰 Вилка: от {estimate_min} до {estimate_max} руб.',
    },
    yandexMetrika: {
        counterId: '',
        events: {
            chat_opened: true,
            estimate_started: true,
            estimate_completed: true,
            lead_created: true,
        },
    },
    amoCRM: {
        webhookUrl: '',
        apiKey: '',
        fieldMapping: [
            { systemField: 'contact_value', crmField: 'Телефон', crmFieldId: '' },
            { systemField: 'apartment_params.area', crmField: 'Площадь', crmFieldId: '' },
            { systemField: 'estimate_min', crmField: 'Бюджет от', crmFieldId: '' },
            { systemField: 'estimate_max', crmField: 'Бюджет до', crmFieldId: '' },
        ],
    },
};

export async function getIntegrations(): Promise<IntegrationSettings> {
    // TODO: GET /api/admin/integrations
    return JSON.parse(JSON.stringify(MOCK_INTEGRATIONS));
}

export async function updateIntegration(
    _service: string,
    _data: unknown
): Promise<void> {
    // TODO: PUT /api/admin/integrations/:service
    console.log(`[mock] Updating integration ${_service}`);
}

export async function testIntegration(
    service: string
): Promise<{ success: boolean; message: string }> {
    // TODO: POST /api/admin/integrations/:service/test
    console.log(`[mock] Testing integration ${service}`);
    return { success: true, message: 'Подключение успешно (mock)' };
}
