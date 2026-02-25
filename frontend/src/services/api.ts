const API_BASE = import.meta.env.VITE_API_URL || ''

export async function submitLead(data: {
    sessionId: string
    contactType: string
    contactValue: string
    apartmentParams: Record<string, string | undefined>
    selectedSegment: string
    estimateMin: number
    estimateMax: number
}) {
    const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to submit lead')
    return res.json()
}
