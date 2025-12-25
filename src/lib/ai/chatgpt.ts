// ChatGPT API Integration - Now calls backend API route for security

/**
 * Call AI backend API route instead of direct OpenAI calls
 */
export async function callChatGPT(
    query: string
): Promise<string> {
    if (!query) {
        throw new Error('Query is required')
    }

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get AI response')
        }

        const data = await response.json()
        return data.content
    } catch (error: any) {
        throw new Error(error?.message || 'Failed to call AI API')
    }
}

/**
 * Test if API configuration is valid by making a simple call
 */
export async function testChatGPTConnection(): Promise<boolean> {
    try {
        await callChatGPT('Hello')
        return true
    } catch (error) {
        return false
    }
}

/**
 * Generate system prompt with database context
 */
export function generateSystemPrompt(): string {
    return `You are an AI assistant for Pearl Cover, an aged care & WorkCover expense tracking application.

You help users find information in their database using natural language queries.

Database Structure:
- notes: User notes with titles, content, tags, and categories
- workcover_claims: WorkCover injury claims with claim numbers, injury descriptions, and status
- workcover_expenses: Expenses linked to WorkCover claims (amounts, reimbursements, gaps)
- aged_care_expenses: Aged care funding expenses
- payment_transactions: Payment records with dates, amounts, and references
- attachments: Receipts and documents with OCR text

When answering user queries:
1. Analyze the search results provided as context
2. Identify the most relevant entities based on the user's question
3. Provide a concise, helpful answer
4. Reference specific entity IDs in your response using this format:
   - For notes: [Note: <title>](ID:<note_id>)
   - For claims: [Claim: <claim_number>](ID:<claim_id>)
   - For expenses: [Expense: <description>](ID:<expense_id>)
   - For payments: [Payment: <reference>](ID:<payment_id>)
5. If multiple matches exist, list the most relevant ones
6. If no matches are found, suggest alternative search terms or related information

Keep responses concise and actionable.`
}

/**
 * Format AI response with clickable links
 */
export function formatResponseWithLinks(aiResponse: string): string {
    let formatted = aiResponse

    // Notes: [Note: <title>](ID:<id>) -> [Note: <title>](/notes?highlight=<id>)
    formatted = formatted.replace(
        /\[Note: ([^\]]+)\]\(ID:([^)]+)\)/g,
        '[$1](/notes?highlight=$2)'
    )

    // Claims: [Claim: <number>](ID:<id>) -> [Claim: <number>](/workcover?claim=<id>)
    formatted = formatted.replace(
        /\[Claim: ([^\]]+)\]\(ID:([^)]+)\)/g,
        '[$1](/workcover?claim=$2)'
    )

    // Expenses: [Expense: <desc>](ID:<id>) -> [Expense: <desc>](/expenses?id=<id>)
    formatted = formatted.replace(
        /\[Expense: ([^\]]+)\]\(ID:([^)]+)\)/g,
        '[$1](/expenses?id=$2)'
    )

    // Payments: [Payment: <ref>](ID:<id>) -> [Payment: <ref>](/payments?id=<id>)
    formatted = formatted.replace(
        /\[Payment: ([^\]]+)\]\(ID:([^)]+)\)/g,
        '[$1](/payments?id=$2)'
    )

    return formatted
}

/**
 * Create context string from search results
 */
export function buildContextFromResults(
    notes: any[],
    claims: any[],
    expenses: any[],
    payments: any[],
    attachments: any[]
): string {
    let context = 'Search Results:\n\n'

    if (notes.length > 0) {
        context += '=== NOTES ===\n'
        notes.forEach((note, idx) => {
            context += `${idx + 1}. ID: ${note.id}\n`
            context += `   Title: ${note.title}\n`
            context += `   Content: ${note.content?.substring(0, 200)}...\n`
            context += `   Tags: ${note.tags?.join(', ') || 'None'}\n\n`
        })
    }

    if (claims.length > 0) {
        context += '=== WORKCOVER CLAIMS ===\n'
        claims.forEach((claim, idx) => {
            context += `${idx + 1}. ID: ${claim.id}\n`
            context += `   Claim Number: ${claim.claim_number}\n`
            context += `   Injury Date: ${claim.injury_date}\n`
            context += `   Description: ${claim.injury_description}\n`
            context += `   Status: ${claim.status}\n\n`
        })
    }

    if (expenses.length > 0) {
        context += '=== EXPENSES ===\n'
        expenses.forEach((expense, idx) => {
            context += `${idx + 1}. ID: ${expense.id}\n`
            context += `   Description: ${expense.description}\n`
            context += `   Amount: $${expense.amount || expense.amount_charged}\n`
            context += `   Date: ${expense.expense_date}\n`
            context += `   Status: ${expense.status}\n\n`
        })
    }

    if (payments.length > 0) {
        context += '=== PAYMENTS ===\n'
        payments.forEach((payment, idx) => {
            context += `${idx + 1}. ID: ${payment.id}\n`
            context += `   Amount: $${payment.total_amount}\n`
            context += `   Date: ${payment.payment_date}\n`
            context += `   Reference: ${payment.reference || 'N/A'}\n\n`
        })
    }

    if (attachments.length > 0) {
        context += '=== ATTACHMENTS (OCR TEXT) ===\n'
        attachments.forEach((attachment, idx) => {
            context += `${idx + 1}. ID: ${attachment.id}\n`
            context += `   File: ${attachment.file_name}\n`
            context += `   OCR Text: ${attachment.ocr_text?.substring(0, 200)}...\n\n`
        })
    }

    if (context === 'Search Results:\n\n') {
        context = 'No search results found in the database.'
    }

    return context
}
