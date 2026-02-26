// ============ Dashboard ============

export interface DashboardMetrics {
    totalVisits: number;
    chatOpened: number;
    estimateStarted: number;
    estimateCompleted: number;
    leadsCreated: number;
    conversionRate: number;
    avgDialogDuration: string;
}

// ============ Dialogs ============

export interface DialogSession {
    id: string;
    created_at: string;
    status: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    contact_type: string | null;
    phone: string | null;
    estimate_min: number | null;
    estimate_max: number | null;
    area: string | null;
    repair_type: string | null;
    segment: string | null;
    manual_rating: string | null;
}

export interface DialogFilters {
    dateRange: 'today' | 'week' | 'month' | 'all';
    status: 'all' | 'converted' | 'active' | 'closed';
    search: string;
}

export interface DialogMessage {
    id: string;
    role: 'user' | 'bot' | 'manager';
    content: string;
    created_at: string;
}

export interface DialogDetailData {
    session: DialogSession & {
        device?: string;
        message_count?: number;
    };
    lead: {
        contact_type: string;
        contact_value: string;
        apartment_params: Record<string, string>;
        estimate_min: number;
        estimate_max: number;
        selected_segment: string;
        manual_rating: string | null;
    } | null;
    messages: DialogMessage[];
}

export type DialogRating = 'good' | 'bad' | 'needs_improvement' | 'repeat';

// ============ Prices ============

export interface PriceRecord {
    work_type_id: number;
    name: string;
    unit: string | null;
    category: string | null;
    segment: string | null;
    price_min: string | null;
    price_max: string | null;
}

export interface NewWorkType {
    name: string;
    unit: string;
    category: string;
    prices: {
        segment: string;
        priceMin: number;
        priceMax: number;
    }[];
}

// ============ Bot Settings ============

export interface BotPersonality {
    name: string;
    tone: 'professional' | 'friendly' | 'neutral';
    language: 'ru' | 'en';
    welcomeMessage: string;
    quickButtons: QuickButton[];
}

export interface QuickButton {
    id: string;
    text: string;
    emoji: string;
    action: 'start_funnel' | 'ask_kb' | 'custom';
}

export interface RepairSegment {
    id: number;
    name: string;
    description: string;
    whatIncluded: string;
    priceRangeMin: number;
    priceRangeMax: number;
    typicalMaterials: string;
}

export interface BotBehavior {
    triggerWords: string[];
    maxMessagesWithoutCta: number;
    estimateDisclaimer: string;
    pdfTtlNotice: string;
}

// ============ Knowledge Base ============

export interface KnowledgeDocument {
    id: number;
    filename: string;
    uploadedAt: string;
    sizeBytes: number;
    status: 'indexing' | 'ready' | 'error';
}

export interface KnowledgeArticle {
    id: number;
    title: string;
    content: string;
    keywords: string[];
    createdAt: string;
}

export interface KnowledgeGap {
    id: number;
    question: string;
    sessionId: string;
    createdAt: string;
    count: number;
}

// ============ Integrations ============

export interface RouterAISettings {
    apiKey: string;
    primaryModel: string;
    fallbackModel: string;
    dailyTokenLimit: number;
    currentMonthUsage: number;
    currentMonthCost: number;
}

export interface TelegramSettings {
    botToken: string;
    chatId: string;
    notificationTemplate: string;
}

export interface YandexMetrikaSettings {
    counterId: string;
    events: {
        chat_opened: boolean;
        estimate_started: boolean;
        estimate_completed: boolean;
        lead_created: boolean;
    };
}

export interface AmoCRMSettings {
    webhookUrl: string;
    apiKey: string;
    fieldMapping: { systemField: string; crmField: string; crmFieldId: string }[];
}

export interface IntegrationSettings {
    routerAI: RouterAISettings;
    telegram: TelegramSettings;
    yandexMetrika: YandexMetrikaSettings;
    amoCRM: AmoCRMSettings;
}
