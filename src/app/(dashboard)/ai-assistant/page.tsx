'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Loader2, Key, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/providers'
import { getAIConfiguration } from '@/lib/api/admin/index'
import { callChatGPT, generateSystemPrompt, formatResponseWithLinks, buildContextFromResults } from '@/lib/ai/chatgpt'
import { searchAllData, getQuickStats } from '@/lib/ai/context-builder'
import type { ChatMessage } from '@/lib/ai/types'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

const SUGGESTED_QUERIES = [
    "Find notes about physiotherapy",
    "Show me all unpaid invoices",
    "What's the total I've spent on medical equipment?",
    "Find receipts with OCR text containing 'Medicare'",
    "List all open WorkCover claims",
    "Show recent payments over $500",
]

export default function AIAssistantPage() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [endpointUrl, setEndpointUrl] = useState('https://api.openai.com/v1')
    const [modelName, setModelName] = useState('gpt-4-turbo-preview')
    const [checkingKey, setCheckingKey] = useState(true)
    const [stats, setStats] = useState({ notes: 0, claims: 0, expenses: 0 })
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load AI configuration and stats
    useEffect(() => {
        async function init() {
            if (!user?.id) return

            try {
                setCheckingKey(true)
                const [config, quickStats] = await Promise.all([
                    getAIConfiguration(user.id),
                    getQuickStats(),
                ])
                setApiKey(config.apiKey)
                setEndpointUrl(config.endpointUrl)
                setModelName(config.modelName)
                setStats(quickStats)
            } catch (error) {
                console.error('Error loading AI assistant:', error)
            } finally {
                setCheckingKey(false)
            }
        }
        init()
    }, [user])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSend() {
        if (!input.trim() || !user?.id || !apiKey) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // 1. Search database for relevant data
            const searchResults = await searchAllData(input)

            // 2. Build context from results
            const context = buildContextFromResults(
                searchResults.notes,
                searchResults.claims,
                searchResults.expenses,
                searchResults.payments,
                searchResults.attachments
            )

            // 3. Call AI endpoint with system prompt + context + user query
            const systemPrompt = generateSystemPrompt()
            const chatMessages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context from database:\n\n${context}\n\nUser question: ${input}` },
            ]

            const aiResponse = await callChatGPT(apiKey, chatMessages, endpointUrl, modelName)

            // 4. Format response with links
            const formattedResponse = formatResponseWithLinks(aiResponse)

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: formattedResponse,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            console.error('AI Assistant error:', error)
            toast.error(error.message || 'Failed to get AI response')

            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    function handleSuggestedQuery(query: string) {
        setInput(query)
    }

    if (checkingKey) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (!apiKey) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
                    <p className="text-muted-foreground">Natural language search for your data</p>
                </div>

                <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                        To use the AI Assistant, you need to configure your AI endpoint in settings.
                        Your configuration is stored securely and only used for your queries.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Setup Required</CardTitle>
                        <CardDescription>
                            Configure your AI endpoint to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Configure AI Endpoint</h3>
                            <p className="text-sm text-muted-foreground">
                                Go to Settings → AI Assistant to configure your endpoint URL, model name, and API key.
                                Supports OpenAI, OpenRouter, and any OpenAI-compatible provider.
                            </p>
                        </div>

                        <Button asChild className="w-full">
                            <Link href="/settings">
                                <Key className="mr-2 h-4 w-4" />
                                Go to Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-indigo-500" />
                    <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
                </div>
                <p className="text-muted-foreground">
                    Ask questions about your notes, claims, expenses, and payments
                </p>
            </div>

            {/* Stats */}
            {messages.length === 0 && (
                <Card className="mb-4">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-indigo-600">{stats.notes}</p>
                                <p className="text-sm text-muted-foreground">Notes</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-indigo-600">{stats.claims}</p>
                                <p className="text-sm text-muted-foreground">Claims</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-indigo-600">{stats.expenses}</p>
                                <p className="text-sm text-muted-foreground">Expenses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Messages */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="space-y-6">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Try asking a question below, or click one of the suggested queries.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <h3 className="font-medium mb-3">Suggested Queries</h3>
                                <div className="grid gap-2">
                                    {SUGGESTED_QUERIES.map((query, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            className="justify-start text-left h-auto py-3"
                                            onClick={() => handleSuggestedQuery(query)}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4 shrink-0 text-indigo-500" />
                                            <span>{query}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, idx) => (
                            <div
                                key={idx}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-muted'
                                        }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    a: ({ node, ...props }) => (
                                                        <Link
                                                            {...props}
                                                            href={props.href || '#'}
                                                            className="text-indigo-600 hover:underline font-medium"
                                                        />
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-3">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="border-t p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your data..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
