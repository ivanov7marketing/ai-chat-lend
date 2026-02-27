export const PLAN_LIMITS: Record<string, Record<string, number>> = {
    free: {
        sessions: 50,
        messages: 500,
        leads: 10,
        tokens: 10000,
        team: 1,
        rag_documents: 3,
        pdf_per_month: 10
    },
    pro: {
        sessions: 1000,
        messages: 10000,
        leads: 200,
        tokens: 500000,
        team: 3,
        rag_documents: 50,
        pdf_per_month: 500
    },
    enterprise: {
        sessions: 999999,
        messages: 999999,
        leads: 999999,
        tokens: 999999,
        team: 999,
        rag_documents: 9999,
        pdf_per_month: 999999
    },
}
