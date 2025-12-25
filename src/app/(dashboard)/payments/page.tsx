'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Search, Filter, Loader2, Download, MoreHorizontal, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getPaymentTransactions, createPaymentTransaction } from '@/lib/api/services'
import type { PaymentTransaction, PaymentType, PaymentMethod } from '@/lib/types/database'

const paymentTypeColors: Record<PaymentType, string> = {
    aged_care: 'bg-emerald-100 text-emerald-800',
    workcover: 'bg-amber-100 text-amber-800',
    mixed: 'bg-purple-100 text-purple-800',
}

const methodLabels: Record<PaymentMethod, string> = {
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    cash: 'Cash',
    cheque: 'Cheque',
    direct_debit: 'Direct Debit',
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const [formData, setFormData] = useState({
        payment_type: 'aged_care' as PaymentType,
        payment_method: 'bank_transfer' as PaymentMethod,
        total_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        payer: '',
        notes: '',
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const data = await getPaymentTransactions()
            setPayments(data)
        } catch (error) {
            console.error('Failed to load payments:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await createPaymentTransaction({
                payment_type: formData.payment_type,
                payment_method: formData.payment_method,
                total_amount: parseFloat(formData.total_amount),
                payment_date: formData.payment_date,
                reference: formData.reference || null,
                payer: formData.payer || null,
                notes: formData.notes || null,
                is_reconciled: false,
                created_by: null,
            })
            setDialogOpen(false)
            setFormData({
                payment_type: 'aged_care',
                payment_method: 'bank_transfer',
                total_amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                reference: '',
                payer: '',
                notes: '',
            })
            loadData()
        } catch (error) {
            console.error('Failed to create payment:', error)
        } finally {
            setSaving(false)
        }
    }

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.payer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'all' || p.payment_type === typeFilter
        return (searchQuery === '' || matchesSearch) && matchesType
    })

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.total_amount, 0)

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
                    <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">Track and manage payment transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Record Payment
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <CreditCard className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{filteredPayments.length} transactions</p>
                </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search payments..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="aged_care">Aged Care</SelectItem>
                        <SelectItem value="workcover">WorkCover</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {filteredPayments.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <CreditCard className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No payments recorded</h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            Record your first payment to start tracking transactions.
                        </p>
                        <Button
                            onClick={() => setDialogOpen(true)}
                            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Record First Payment
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Payer</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={paymentTypeColors[payment.payment_type]}>
                                                {payment.payment_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {payment.payment_method ? methodLabels[payment.payment_method] : '-'}
                                        </TableCell>
                                        <TableCell>{payment.reference || '-'}</TableCell>
                                        <TableCell>{payment.payer || '-'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${payment.total_amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={payment.is_reconciled ? 'default' : 'outline'}>
                                                {payment.is_reconciled ? 'Reconciled' : 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>Add a new payment transaction</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Payment Type *</Label>
                                    <Select
                                        value={formData.payment_type}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, payment_type: v as PaymentType }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="aged_care">Aged Care</SelectItem>
                                            <SelectItem value="workcover">WorkCover</SelectItem>
                                            <SelectItem value="mixed">Mixed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Method *</Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v as PaymentMethod }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="direct_debit">Direct Debit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Amount ($) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Reference</Label>
                                    <Input
                                        value={formData.reference}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                                        placeholder="PAY-001"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payer</Label>
                                    <Input
                                        value={formData.payer}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payer: e.target.value }))}
                                        placeholder="Name"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
