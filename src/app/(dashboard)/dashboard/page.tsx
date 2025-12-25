'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Heart,
    Shield,
    CreditCard,
    FileText,
    Plus,
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Loader2,
    DollarSign,
    Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    getFundingAccountBalances,
    getWorkcoverClaimSummaries,
    getTransactionLedger,
    getAgedCareExpenses,
    getWorkcoverExpenses,
} from '@/lib/api/services'
import type {
    FundingAccountBalance,
    WorkcoverClaimSummary,
    TransactionLedgerEntry
} from '@/lib/types/database'

export default function DashboardPage() {
    const [fundingBalances, setFundingBalances] = useState<FundingAccountBalance[]>([])
    const [claimSummaries, setClaimSummaries] = useState<WorkcoverClaimSummary[]>([])
    const [recentActivity, setRecentActivity] = useState<TransactionLedgerEntry[]>([])
    const [pendingAgedCare, setPendingAgedCare] = useState(0)
    const [pendingWorkcover, setPendingWorkcover] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [balances, claims, ledger, agedCareExpenses, workcoverExpenses] = await Promise.all([
                getFundingAccountBalances(),
                getWorkcoverClaimSummaries(),
                getTransactionLedger(10),
                getAgedCareExpenses({ status: 'pending' }),
                getWorkcoverExpenses(),
            ])
            setFundingBalances(balances)
            setClaimSummaries(claims)
            setRecentActivity(ledger)
            setPendingAgedCare(agedCareExpenses.reduce((sum, e) => sum + e.amount, 0))
            setPendingWorkcover(workcoverExpenses.filter(e => e.status === 'pending_submission' || e.status === 'submitted').length)
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate totals
    const totalAgedCareBalance = fundingBalances.reduce((sum, b) => sum + b.current_balance, 0)
    const totalWorkcoverGap = claimSummaries.reduce((sum, c) => sum + c.total_gap, 0)
    const totalWorkcoverPending = claimSummaries.reduce((sum, c) => sum + c.pending_count, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s an overview of your accounts.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/aged-care">
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </Link>
                    <Link href="/reports">
                        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                            <FileText className="mr-2 h-4 w-4" />
                            View Reports
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Aged Care Balance */}
                <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aged Care Balance</CardTitle>
                        <Heart className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            ${totalAgedCareBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {fundingBalances.length} funding account{fundingBalances.length !== 1 ? 's' : ''}
                        </p>
                        {pendingAgedCare > 0 && (
                            <div className="mt-2 flex items-center text-xs text-amber-600">
                                <Clock className="mr-1 h-3 w-3" />
                                ${pendingAgedCare.toFixed(2)} pending
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* WorkCover Gap */}
                <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">WorkCover Gap</CardTitle>
                        <Shield className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            ${totalWorkcoverGap.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {claimSummaries.length} active claim{claimSummaries.length !== 1 ? 's' : ''}
                        </p>
                        {totalWorkcoverPending > 0 && (
                            <div className="mt-2 flex items-center text-xs text-amber-600">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {totalWorkcoverPending} expense{totalWorkcoverPending !== 1 ? 's' : ''} pending
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Submissions */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {pendingWorkcover}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            WorkCover expenses to submit
                        </p>
                    </CardContent>
                </Card>

                {/* Accounts */}
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${fundingBalances.reduce((sum, b) => sum + b.total_allocated, 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all funding accounts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Link href="/aged-care" className="block">
                            <Button variant="outline" className="w-full justify-between group">
                                <span className="flex items-center">
                                    <Heart className="mr-2 h-4 w-4 text-emerald-500" />
                                    Add Aged Care Expense
                                </span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Link>
                        <Link href="/workcover" className="block">
                            <Button variant="outline" className="w-full justify-between group">
                                <span className="flex items-center">
                                    <Shield className="mr-2 h-4 w-4 text-amber-500" />
                                    Add WorkCover Expense
                                </span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Link>
                        <Link href="/payments" className="block">
                            <Button variant="outline" className="w-full justify-between group">
                                <span className="flex items-center">
                                    <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                                    Record Payment
                                </span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Link>
                        <Link href="/notes" className="block">
                            <Button variant="outline" className="w-full justify-between group">
                                <span className="flex items-center">
                                    <FileText className="mr-2 h-4 w-4 text-purple-500" />
                                    Create Note
                                </span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                        <CardDescription>Latest transactions and changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                                    <TrendingUp className="h-6 w-6 text-indigo-500" />
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">No recent activity</p>
                                <p className="text-xs text-muted-foreground">Start adding expenses to see them here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 5).map((item, index) => (
                                    <div key={`${item.source_id}-${index}`} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.source_type === 'aged_care_expense' ? 'bg-emerald-100' : 'bg-amber-100'
                                                }`}>
                                                {item.source_type === 'aged_care_expense'
                                                    ? <Heart className="h-4 w-4 text-emerald-600" />
                                                    : <Shield className="h-4 w-4 text-amber-600" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[200px]">
                                                    {item.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(item.transaction_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                ${item.amount.toFixed(2)}
                                            </p>
                                            <Badge variant="outline" className="text-xs">
                                                {item.payment_status || item.transaction_type}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Funding Accounts Overview */}
            {fundingBalances.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Funding Accounts</CardTitle>
                                <CardDescription>Balance overview for all accounts</CardDescription>
                            </div>
                            <Link href="/reports">
                                <Button variant="ghost" size="sm">
                                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {fundingBalances.map(account => {
                                const usedPercent = account.total_allocated > 0
                                    ? (account.total_expenses / account.total_allocated) * 100
                                    : 0
                                return (
                                    <div key={account.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{account.account_name}</span>
                                            <span className="text-muted-foreground">
                                                ${account.current_balance.toFixed(2)} remaining
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${usedPercent > 90 ? 'bg-red-500' :
                                                    usedPercent > 70 ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${Math.min(usedPercent, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ${account.total_expenses.toFixed(2)} of ${account.total_allocated.toFixed(2)} used ({usedPercent.toFixed(0)}%)
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
