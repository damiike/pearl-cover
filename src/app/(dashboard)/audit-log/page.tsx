'use client'

import { useState, useEffect } from 'react'
import { History, Search, Filter, Loader2, Download, User, FileText, CreditCard, Shield, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getAuditLogs } from '@/lib/api/services'
import type { AuditLog } from '@/lib/types/database'

const actionColors = {
    create: 'bg-emerald-100 text-emerald-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
}

const entityIcons: Record<string, React.ElementType> = {
    aged_care_expenses: Heart,
    workcover_expenses: Shield,
    workcover_claims: Shield,
    payment_transactions: CreditCard,
    funding_accounts: FileText,
    funding_allocations: FileText,
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [entityFilter, setEntityFilter] = useState<string>('all')
    const [actionFilter, setActionFilter] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const data = await getAuditLogs({ limit: 200 })
            setLogs(data)
        } catch (error) {
            console.error('Failed to load audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = searchQuery === '' ||
            log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter
        const matchesAction = actionFilter === 'all' || log.action === actionFilter
        return matchesSearch && matchesEntity && matchesAction
    })

    const uniqueEntityTypes = [...new Set(logs.map(l => l.entity_type))]

    function formatEntityType(type: string) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    function formatTimestamp(ts: string) {
        const date = new Date(ts)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">Track all system changes and activities</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Log
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search audit entries..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Entity Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        {uniqueEntityTypes.map(type => (
                            <SelectItem key={type} value={type}>{formatEntityType(type)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create">Create</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Audit Entries */}
            {filteredLogs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <History className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                            {logs.length === 0 ? 'No audit entries' : 'No matching entries'}
                        </h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            {logs.length === 0
                                ? 'System activities will appear here as changes are made.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Activity Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-4">
                                {filteredLogs.map((log, idx) => {
                                    const Icon = entityIcons[log.entity_type] || FileText
                                    return (
                                        <div key={log.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${log.action === 'create' ? 'bg-emerald-100' :
                                                        log.action === 'update' ? 'bg-blue-100' : 'bg-red-100'
                                                    }`}>
                                                    <Icon className={`h-5 w-5 ${log.action === 'create' ? 'text-emerald-600' :
                                                            log.action === 'update' ? 'text-blue-600' : 'text-red-600'
                                                        }`} />
                                                </div>
                                                {idx < filteredLogs.length - 1 && (
                                                    <div className="w-px flex-1 bg-border mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className={actionColors[log.action as keyof typeof actionColors]}>
                                                        {log.action}
                                                    </Badge>
                                                    <span className="font-medium">{formatEntityType(log.entity_type)}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    ID: {log.entity_id.slice(0, 8)}...
                                                </p>
                                                {log.new_values && log.action === 'create' && (
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {typeof log.new_values === 'object' && 'description' in (log.new_values as object) && (
                                                            <p>Description: {(log.new_values as { description: string }).description}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
