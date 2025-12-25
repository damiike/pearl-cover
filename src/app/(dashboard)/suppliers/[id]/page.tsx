'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Phone, Mail, MapPin, FileText, ArrowUpRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getSupplier, getAgedCareExpenses, getWorkcoverExpenses } from '@/lib/api/services'
import type { Supplier, AgedCareExpenseWithRelations, WorkcoverExpenseWithRelations } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

interface SupplierDetailsPageProps {
    params: Promise<{
        id: string
    }>
}

type UnifiedExpense = {
    id: string
    date: string
    invoice_number: string | null
    description: string
    amount: number
    status: string
    type: 'aged_care' | 'workcover'
    category_name: string
    payment_transaction_id: string | null
}

export default function SupplierDetailsPage({ params }: SupplierDetailsPageProps) {
    const { id } = use(params)
    const router = useRouter()
    const [supplier, setSupplier] = useState<Supplier | null>(null)
    const [expenses, setExpenses] = useState<UnifiedExpense[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')


    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true)
                const [supplierData, agedCareData, workcoverData] = await Promise.all([
                    getSupplier(id),
                    getAgedCareExpenses({ supplierId: id }),
                    getWorkcoverExpenses({ supplierId: id })
                ])
                setSupplier(supplierData)

                // Unify expenses
                const unified: UnifiedExpense[] = [
                    ...agedCareData.map(e => ({
                        id: e.id,
                        date: e.expense_date,
                        invoice_number: e.invoice_number || null,
                        description: e.description,
                        amount: e.amount,
                        status: e.status,
                        type: 'aged_care' as const,
                        category_name: e.category?.name || 'Uncategorized',
                        payment_transaction_id: e.payment_transaction_id || null
                    })),
                    ...workcoverData.map(e => ({
                        id: e.id,
                        date: e.expense_date,
                        invoice_number: e.invoice_number || null,
                        description: e.description,
                        amount: e.amount_charged,
                        status: e.status,
                        type: 'workcover' as const,
                        category_name: e.category?.name || 'Uncategorized',
                        payment_transaction_id: e.payment_transaction_id || null
                    }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                setExpenses(unified)
            } catch (error) {
                console.error('Failed to load supplier details:', error)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            loadData()
        }
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (!supplier) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Supplier not found</h2>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        )
    }

    const typeLabels: Record<string, string> = {
        medical: 'Medical',
        allied_health: 'Allied Health',
        equipment: 'Equipment',
        transport: 'Transport',
        care_services: 'Care Services',
        other: 'Other',
    }

    return (
        <div className="space-y-6">
            {/* Header / Back */}
            <div>
                <Button variant="ghost" className="pl-0 gap-2 mb-4" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    Back to Suppliers
                </Button>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Supplier Info Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                                    <Badge variant="secondary" className="mt-2">
                                        {typeLabels[supplier.supplier_type] || supplier.supplier_type}
                                    </Badge>
                                </div>
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {supplier.contact_name && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Contact</span>
                                    <span className="font-medium">{supplier.contact_name}</span>
                                </div>
                            )}

                            {(supplier.phone || supplier.email || supplier.address) && (
                                <div className="space-y-3 pt-2 border-t">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a href={`mailto:${supplier.email}`} className="hover:underline text-indigo-600">
                                                {supplier.email}
                                            </a>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-start gap-3 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <span>{supplier.address}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {supplier.abn && (
                                <div className="pt-2 border-t">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">ABN</span>
                                        <span className="font-mono text-sm">{supplier.abn}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats & Invoices */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Spent</CardDescription>
                                    <CardTitle className="text-2xl">
                                        {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Invoices</CardDescription>
                                    <CardTitle className="text-2xl">{expenses.length}</CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Invoices List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    Invoice History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search and Filters */}
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by invoice number or description..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="disputed">Disputed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(() => {
                                    // Filter expenses based on search and status
                                    const filteredExpenses = expenses.filter(expense => {
                                        const matchesSearch = searchQuery === '' ||
                                            expense.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            expense.description.toLowerCase().includes(searchQuery.toLowerCase())

                                        const matchesStatus = statusFilter === 'all' ||
                                            expense.status.toLowerCase() === statusFilter.toLowerCase()

                                        return matchesSearch && matchesStatus
                                    })

                                    return filteredExpenses.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">
                                            {expenses.length === 0 ? 'No invoices found for this supplier.' : 'No invoices match your filters.'}
                                        </p>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Invoice #</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredExpenses.map((expense) => (
                                                        <TableRow key={`${expense.type}-${expense.id}`}>
                                                            <TableCell className="font-medium whitespace-nowrap">
                                                                {new Date(expense.date).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell>{expense.invoice_number || '-'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {expense.type.replace('_', ' ')}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="max-w-[200px] truncate" title={expense.description}>
                                                                {expense.description}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(expense.amount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={
                                                                        expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                            expense.status === 'pending' || expense.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                                                                'bg-slate-100 text-slate-800'
                                                                    }
                                                                >
                                                                    {expense.status.replace('_', ' ')}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {expense.payment_transaction_id && (
                                                                    <Link
                                                                        href={`/payments?highlight=${expense.payment_transaction_id}`}
                                                                        title="View Transaction"
                                                                    >
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600">
                                                                            <ArrowUpRight className="h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
