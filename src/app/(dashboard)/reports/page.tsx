'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, Loader2, DollarSign, TrendingUp, FileText, Shield, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getFundingAccountBalances, getWorkcoverClaimSummaries, getAgedCareExpenses, getWorkcoverExpenses } from '@/lib/api/services'
import type { FundingAccountBalance, WorkcoverClaimSummary } from '@/lib/types/database'

export default function ReportsPage() {
    const [fundingBalances, setFundingBalances] = useState<FundingAccountBalance[]>([])
    const [claimSummaries, setClaimSummaries] = useState<WorkcoverClaimSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('all')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [balances, claims] = await Promise.all([
                getFundingAccountBalances(),
                getWorkcoverClaimSummaries(),
            ])
            setFundingBalances(balances)
            setClaimSummaries(claims)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function exportToCSV(type: 'aged_care' | 'workcover') {
        try {
            const data = type === 'aged_care'
                ? await getAgedCareExpenses()
                : await getWorkcoverExpenses()

            const headers = type === 'aged_care'
                ? ['Date', 'Description', 'Supplier', 'Category', 'Amount', 'Status']
                : ['Date', 'Description', 'Claim', 'Charged', 'Reimbursed', 'Gap', 'Status']

            const rows = data.map(item => {
                if (type === 'aged_care' && 'amount' in item) {
                    return [
                        item.expense_date,
                        item.description,
                        item.supplier?.name || '',
                        item.category?.name || '',
                        item.amount.toFixed(2),
                        item.status,
                    ]
                } else if ('amount_charged' in item) {
                    return [
                        item.expense_date,
                        item.description,
                        item.claim?.claim_number || '',
                        item.amount_charged.toFixed(2),
                        item.amount_reimbursed.toFixed(2),
                        item.gap_amount.toFixed(2),
                        item.status,
                    ]
                }
                return []
            })

            const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${type}_expenses_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to export:', error)
        }
    }

    // Calculate totals
    const totalFundingBalance = fundingBalances.reduce((sum, b) => sum + b.current_balance, 0)
    const totalFundingExpenses = fundingBalances.reduce((sum, b) => sum + b.total_expenses, 0)
    const totalWorkcoverGap = claimSummaries.reduce((sum, c) => sum + c.total_gap, 0)
    const totalWorkcoverCharged = claimSummaries.reduce((sum, c) => sum + c.total_charged, 0)
    const totalWorkcoverReimbursed = claimSummaries.reduce((sum, c) => sum + c.total_reimbursed, 0)

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
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Financial summaries and exports</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Aged Care Summary */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-emerald-500" />
                        Aged Care Summary
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('aged_care')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                ${totalFundingBalance.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across {fundingBalances.length} accounts
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalFundingExpenses.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                All time spending
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                ${fundingBalances.reduce((sum, b) => sum + b.pending_amount, 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Awaiting payment
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Account Breakdown */}
                {fundingBalances.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Account Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {fundingBalances.map(account => (
                                    <div key={account.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{account.account_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {account.funding_type.replace(/_/g, ' ')} {account.funding_level && `- ${account.funding_level}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-emerald-600">${account.current_balance.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Spent: ${account.total_expenses.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* WorkCover Summary */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-500" />
                        WorkCover Summary
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('workcover')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-amber-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Gap</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                ${totalWorkcoverGap.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Out-of-pocket expenses
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Charged</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalWorkcoverCharged.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Medical expenses
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Reimbursed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                ${totalWorkcoverReimbursed.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Amount recovered
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Claim Breakdown */}
                {claimSummaries.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Claims Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {claimSummaries.map(claim => (
                                    <div key={claim.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{claim.claim_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {claim.expense_count} expenses • Status: {claim.status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-amber-600">Gap: ${claim.total_gap.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Charged: ${claim.total_charged.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Empty State */}
            {fundingBalances.length === 0 && claimSummaries.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <BarChart3 className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            Add expenses and funding accounts to generate reports.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
