'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, Heart, Shield, Building2, FileText, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    getAgedCareExpenses,
    getWorkcoverExpenses,
    getSuppliers,
    getNotes
} from '@/lib/api/services'

interface SearchResult {
    type: 'aged_care' | 'workcover' | 'supplier' | 'note'
    id: string
    title: string
    subtitle: string
    href: string
}

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    async function handleSearch() {
        if (!query.trim()) return

        setLoading(true)
        setHasSearched(true)

        try {
            const [agedCare, workcover, suppliers, notes] = await Promise.all([
                getAgedCareExpenses(),
                getWorkcoverExpenses(),
                getSuppliers(),
                getNotes({ isArchived: false }),
            ])

            const searchTerm = query.toLowerCase()
            const searchResults: SearchResult[] = []

            // Search aged care expenses
            agedCare.forEach(expense => {
                if (expense.description.toLowerCase().includes(searchTerm) ||
                    expense.supplier?.name.toLowerCase().includes(searchTerm) ||
                    expense.invoice_number?.toLowerCase().includes(searchTerm)) {
                    searchResults.push({
                        type: 'aged_care',
                        id: expense.id,
                        title: expense.description,
                        subtitle: `$${expense.amount.toFixed(2)} • ${new Date(expense.expense_date).toLocaleDateString()}`,
                        href: '/aged-care',
                    })
                }
            })

            // Search workcover expenses
            workcover.forEach(expense => {
                if (expense.description.toLowerCase().includes(searchTerm) ||
                    expense.claim?.claim_number.toLowerCase().includes(searchTerm)) {
                    searchResults.push({
                        type: 'workcover',
                        id: expense.id,
                        title: expense.description,
                        subtitle: `Claim: ${expense.claim?.claim_number || 'N/A'} • $${expense.amount_charged.toFixed(2)}`,
                        href: '/workcover',
                    })
                }
            })

            // Search suppliers
            suppliers.forEach(supplier => {
                if (supplier.name.toLowerCase().includes(searchTerm) ||
                    supplier.contact_name?.toLowerCase().includes(searchTerm) ||
                    supplier.email?.toLowerCase().includes(searchTerm)) {
                    searchResults.push({
                        type: 'supplier',
                        id: supplier.id,
                        title: supplier.name,
                        subtitle: `${supplier.supplier_type.replace('_', ' ')} ${supplier.contact_name ? `• ${supplier.contact_name}` : ''}`,
                        href: '/suppliers',
                    })
                }
            })

            // Search notes
            notes.forEach(note => {
                if (note.title.toLowerCase().includes(searchTerm) ||
                    note.content?.toLowerCase().includes(searchTerm)) {
                    searchResults.push({
                        type: 'note',
                        id: note.id,
                        title: note.title,
                        subtitle: note.content?.slice(0, 100) || 'No content',
                        href: '/notes',
                    })
                }
            })

            setResults(searchResults)
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const typeIcons = {
        aged_care: Heart,
        workcover: Shield,
        supplier: Building2,
        note: FileText,
    }

    const typeColors = {
        aged_care: 'bg-emerald-100 text-emerald-800',
        workcover: 'bg-amber-100 text-amber-800',
        supplier: 'bg-purple-100 text-purple-800',
        note: 'bg-blue-100 text-blue-800',
    }

    const typeLabels = {
        aged_care: 'Aged Care',
        workcover: 'WorkCover',
        supplier: 'Supplier',
        note: 'Note',
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Search</h1>
                <p className="text-muted-foreground">Search across all records</p>
            </div>

            {/* Search Box */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search for expenses, suppliers, notes..."
                                className="pl-12 h-12 text-lg"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <Button
                            size="lg"
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2">
                <Link href="/aged-care">
                    <Button variant="outline" size="sm">
                        <Heart className="mr-2 h-4 w-4 text-emerald-500" />
                        Aged Care
                    </Button>
                </Link>
                <Link href="/workcover">
                    <Button variant="outline" size="sm">
                        <Shield className="mr-2 h-4 w-4 text-amber-500" />
                        WorkCover
                    </Button>
                </Link>
                <Link href="/suppliers">
                    <Button variant="outline" size="sm">
                        <Building2 className="mr-2 h-4 w-4 text-purple-500" />
                        Suppliers
                    </Button>
                </Link>
                <Link href="/notes">
                    <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        Notes
                    </Button>
                </Link>
            </div>

            {/* Results */}
            {hasSearched && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">
                        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </h2>

                    {results.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                                    <Search className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                                <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                                    Try a different search term or browse the categories above.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {results.map(result => {
                                const Icon = typeIcons[result.type]
                                return (
                                    <Card key={`${result.type}-${result.id}`} className="hover:border-indigo-500/50 transition-colors">
                                        <Link href={result.href}>
                                            <CardContent className="flex items-center gap-4 py-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${result.type === 'aged_care' ? 'bg-emerald-100' :
                                                        result.type === 'workcover' ? 'bg-amber-100' :
                                                            result.type === 'supplier' ? 'bg-purple-100' : 'bg-blue-100'
                                                    }`}>
                                                    <Icon className={`h-5 w-5 ${result.type === 'aged_care' ? 'text-emerald-600' :
                                                            result.type === 'workcover' ? 'text-amber-600' :
                                                                result.type === 'supplier' ? 'text-purple-600' : 'text-blue-600'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium truncate">{result.title}</p>
                                                        <Badge className={typeColors[result.type]} variant="secondary">
                                                            {typeLabels[result.type]}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                            </CardContent>
                                        </Link>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
