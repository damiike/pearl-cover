'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus, Search, Filter, Loader2, Trash2, Edit, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    DialogTrigger,
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
import {
    getAgedCareExpenses,
    createAgedCareExpense,
    updateAgedCareExpense,
    deleteAgedCareExpense,
    getFundingAccounts,
    getSuppliers,
    getExpenseCategories,
    addExpenseTag,
    removeExpenseTag,
    getUsedTags,
} from '@/lib/api/services'
import { TagInput } from '@/components/ui/tag-input'
import type { AgedCareExpenseWithRelations, FundingAccount, Supplier, ExpenseCategory, AgedCareExpenseStatus } from '@/lib/types/database'

const statusColors: Record<AgedCareExpenseStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    disputed: 'bg-red-100 text-red-800',
    written_off: 'bg-slate-100 text-slate-800',
}

interface ExpenseFormData {
    funding_account_id: string
    supplier_id: string | null
    category_id: string | null
    description: string
    amount: string
    expense_date: string
    invoice_number: string
    status: AgedCareExpenseStatus
    tags: string[]
}

const initialFormData: ExpenseFormData = {
    funding_account_id: '',
    supplier_id: null,
    category_id: null,
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    status: 'pending',
    tags: [],
}

export default function AgedCarePage() {
    const [expenses, setExpenses] = useState<AgedCareExpenseWithRelations[]>([])
    const [fundingAccounts, setFundingAccounts] = useState<FundingAccount[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<ExpenseFormData>(initialFormData)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [filterTags, setFilterTags] = useState<string[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [expensesData, accountsData, suppliersData, categoriesData, tagsData] = await Promise.all([
                getAgedCareExpenses(),
                getFundingAccounts(),
                getSuppliers(),
                getExpenseCategories('aged_care'),
                getUsedTags(),
            ])
            setExpenses(expensesData)
            setFundingAccounts(accountsData)
            setSuppliers(suppliersData)
            setCategories(categoriesData)
            setAvailableTags(tagsData)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    function openNewDialog() {
        setEditingId(null)
        setFormData({
            ...initialFormData,
            funding_account_id: fundingAccounts[0]?.id || '',
        })
        setDialogOpen(true)
    }

    function openEditDialog(expense: AgedCareExpenseWithRelations) {
        setEditingId(expense.id)
        setFormData({
            funding_account_id: expense.funding_account_id,
            supplier_id: expense.supplier_id,
            category_id: expense.category_id,
            description: expense.description,
            amount: expense.amount.toString(),
            expense_date: expense.expense_date,
            invoice_number: expense.invoice_number || '',
            status: expense.status,
            tags: expense.tags?.map(t => t.tag_name) || [],
        })
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const data = {
                funding_account_id: formData.funding_account_id,
                supplier_id: formData.supplier_id || null,
                category_id: formData.category_id || null,
                description: formData.description,
                amount: parseFloat(formData.amount),
                expense_date: formData.expense_date,
                invoice_number: formData.invoice_number || null,
                status: formData.status,
                payment_transaction_id: null,
                created_by: null,
            }

            let expenseId = editingId

            if (editingId) {
                await updateAgedCareExpense(editingId, data)
            } else {
                const newExpense = await createAgedCareExpense(data)
                expenseId = newExpense.id
            }

            // Handle Tags
            if (expenseId) {
                const currentTags = editingId
                    ? expenses.find(e => e.id === editingId)?.tags || []
                    : []
                const currentTagNames = currentTags.map(t => t.tag_name)
                const newTagNames = formData.tags

                const toAdd = newTagNames.filter(t => !currentTagNames.includes(t))
                const toRemove = currentTags.filter(t => !newTagNames.includes(t.tag_name))

                await Promise.all([
                    ...toAdd.map(tag => addExpenseTag(expenseId!, 'aged_care', tag)),
                    ...toRemove.map(tag => removeExpenseTag(tag.id))
                ])
            }

            setDialogOpen(false)
            loadData()
        } catch (error) {
            console.error('Failed to save expense:', error)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this expense?')) return
        try {
            await deleteAgedCareExpense(id)
            loadData()
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
        const matchesTags = filterTags.length === 0 || filterTags.every(t => expense.tags?.some(et => et.tag_name === t))
        return matchesSearch && matchesStatus && matchesTags
    })

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
                    <h1 className="text-2xl font-bold tracking-tight">Aged Care</h1>
                    <p className="text-muted-foreground">
                        Manage aged care claims and expenses
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={openNewDialog}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? 'Update expense details' : 'Record a new aged care expense'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="funding_account">Funding Account *</Label>
                                    <Select
                                        value={formData.funding_account_id}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, funding_account_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fundingAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.account_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter expense description"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">Amount ($) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.expense_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="supplier">Supplier</Label>
                                        <Select
                                            value={formData.supplier_id || 'none'}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_id: v === 'none' ? null : v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {suppliers.map(supplier => (
                                                    <SelectItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category_id || 'none'}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="invoice">Invoice Number</Label>
                                        <Input
                                            id="invoice"
                                            value={formData.invoice_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                                            placeholder="INV-001"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as AgedCareExpenseStatus }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="disputed">Disputed</SelectItem>
                                                <SelectItem value="written_off">Written Off</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tags</Label>
                                    <TagInput
                                        selectedTags={formData.tags}
                                        onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                                        availableTags={availableTags}
                                        placeholder="Add tags..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                >
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search expenses..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="written_off">Written Off</SelectItem>
                    </SelectContent>
                </Select>
                <div className="w-full sm:w-[300px]">
                    <TagInput
                        selectedTags={filterTags}
                        onTagsChange={setFilterTags}
                        availableTags={availableTags}
                        placeholder="Filter by tags..."
                    />
                </div>
            </div>

            {/* Expenses Table or Empty State */}
            {filteredExpenses.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <Heart className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                            {expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
                        </h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            {expenses.length === 0
                                ? 'Start by adding your first aged care expense.'
                                : 'Try adjusting your search or filter criteria.'}
                        </p>
                        {expenses.length === 0 && (
                            <Button
                                onClick={openNewDialog}
                                className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Expense
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">
                                        {new Date(expense.expense_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {expense.description}
                                    </TableCell>
                                    <TableCell>{expense.supplier?.name || '-'}</TableCell>
                                    <TableCell>{expense.category?.name || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {expense.tags?.map(tag => (
                                                <Badge key={tag.id} variant="secondary" className="text-xs px-1 h-5">
                                                    {tag.tag_name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${expense.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[expense.status]}>
                                            {expense.status.replace('_', ' ')}
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
                                                <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(expense.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}
