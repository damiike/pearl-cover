// AI Assistant Types

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
}

export interface SearchResult {
    type: 'note' | 'claim' | 'expense' | 'payment' | 'attachment'
    id: string
    title: string
    description: string
    relevance: number
    metadata?: Record<string, any>
}

export interface AIContext {
    notes: any[]
    claims: any[]
    expenses: any[]
    payments: any[]
    attachments: any[]
}

export interface AIResponse {
    answer: string
    results: SearchResult[]
    confidence: number
}
