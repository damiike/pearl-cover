'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Search, Filter, Loader2, Trash2, Edit, MoreHorizontal, AlertCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
    getWorkcoverClaims,
    getWorkcoverExpenses,
    getWorkcoverClaimSummaries,
    createWorkcoverClaim,
    createWorkcoverExpense,
    updateWorkcoverExpense,
    deleteWorkcoverExpense,
    getSuppliers,
    getExpenseCategories,
    addExpenseTag,
    removeExpenseTag,
    getUsedTags,
} from '@/lib/api/services'
import { TagInput } from '@/components/ui/tag-input'
import type {
    WorkcoverClaim,
    WorkcoverExpenseWithRelations,
    WorkcoverClaimSummary,
    Supplier,
    ExpenseCategory,
    WorkcoverExpenseStatus,
    WorkcoverClaimStatus
} from '@/lib/types/database'

const claimStatusColors: Record<WorkcoverClaimStatus, string> = {
    open: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-100 text-slate-800',
    under_review: 'bg-amber-100 text-amber-800',
}

const expenseStatusColors: Record<WorkcoverExpenseStatus, string> = {
    pending_submission: 'bg-slate-100 text-slate-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-emerald-100 text-emerald-800',
    partially_paid: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
}

export default function WorkCoverPage() {
    const [claims, setClaims] = useState<WorkcoverClaim[]>([])
    const [claimSummaries, setClaimSummaries] = useState<WorkcoverClaimSummary[]>([])
    const [expenses, setExpenses] = useState<WorkcoverExpenseWithRelations[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [claimDialogOpen, setClaimDialogOpen] = useState(false)
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTags, setFilterTags] = useState<string[]>([])

    // Claim form
    const [claimForm, setClaimForm] = useState({
        claim_number: '',
        injury_date: new Date().toISOString().split('T')[0],
        injury_description: '',
        status: 'open' as WorkcoverClaimStatus,
        insurer_name: '',
        insurer_contact: '',
    })

    // Expense form
    const [expenseForm, setExpenseForm] = useState({
        claim_id: '',
        supplier_id: null as string | null,
        category_id: null as string | null,
        description: '',
        amount_charged: '',
        amount_claimed: '',
        expense_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        status: 'pending_submission' as WorkcoverExpenseStatus,
        tags: [] as string[],
    })
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const [claimsData, expensesData, summariesData, suppliersData, categoriesData, tagsData] = await Promise.all([
                getWorkcoverClaims(),
                getWorkcoverExpenses(), // Fetch all expenses initially
                getWorkcoverClaimSummaries(),
                getSuppliers(),
                getExpenseCategories('workcover'),
                getUsedTags(),
            ])
            setClaims(claimsData)
            setClaimSummaries(summariesData)
            setExpenses(expensesData)
            setSuppliers(suppliersData)
            setCategories(categoriesData)
            setAvailableTags(tagsData || [])
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateClaim(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await createWorkcoverClaim({
                claim_number: claimForm.claim_number,
                injury_date: claimForm.injury_date,
                injury_description: claimForm.injury_description || null,
                status: claimForm.status,
                insurer_name: claimForm.insurer_name || null,
                insurer_contact: claimForm.insurer_contact || null,
            })
            setClaimDialogOpen(false)
            setClaimForm({
                claim_number: '',
                injury_date: new Date().toISOString().split('T')[0],
                injury_description: '',
                status: 'open',
                insurer_name: '',
                insurer_contact: '',
            })
            loadData()
        } catch (error) {
            console.error('Failed to create claim:', error)
        } finally {
            setSaving(false)
        }
    }

    async function handleSubmitExpense(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const data = {
                claim_id: expenseForm.claim_id,
                supplier_id: expenseForm.supplier_id,
                category_id: expenseForm.category_id,
                description: expenseForm.description,
                amount_charged: parseFloat(expenseForm.amount_charged),
                amount_claimed: expenseForm.amount_claimed ? parseFloat(expenseForm.amount_claimed) : null,
                amount_reimbursed: 0,
                expense_date: expenseForm.expense_date,
                invoice_number: expenseForm.invoice_number || null,
                status: expenseForm.status,
                submission_date: null,
                reimbursement_date: null,
                payment_transaction_id: null,
                created_by: null,
            }

            let expenseId = editingExpenseId

            if (editingExpenseId) {
                await updateWorkcoverExpense(editingExpenseId, data)
            } else {
                const newExpense = await createWorkcoverExpense(data)
                expenseId = newExpense.id
            }

            // Handle Tags
            if (expenseId) {
                const currentTags = editingExpenseId
                    ? expenses.find(e => e.id === editingExpenseId)?.tags || []
                    : []
                const currentTagNames = currentTags.map(t => t.tag_name)
                const newTagNames = expenseForm.tags

                const toAdd = newTagNames.filter(t => !currentTagNames.includes(t))
                const toRemove = currentTags.filter(t => !newTagNames.includes(t.tag_name))

                await Promise.all([
                    ...toAdd.map(tag => addExpenseTag(expenseId!, 'workcover', tag)),
                    ...toRemove.map(tag => removeExpenseTag(tag.id))
                ])
            }

            setExpenseDialogOpen(false)
            resetExpenseForm()
            loadData()
        } catch (error) {
            console.error('Failed to save expense:', error)
        } finally {
            setSaving(false)
        }
    }

    function resetExpenseForm() {
        setEditingExpenseId(null)
        setExpenseForm({
            claim_id: claims[0]?.id || '',
            supplier_id: null,
            category_id: null,
            description: '',
            amount_charged: '',
            amount_claimed: '',
            expense_date: new Date().toISOString().split('T')[0],
            invoice_number: '',
            status: 'pending_submission',
            tags: [],
        })
    }

    function openNewExpenseDialog() {
        resetExpenseForm()
        if (claims.length > 0) {
            setExpenseForm(prev => ({ ...prev, claim_id: claims[0].id }))
        }
        setExpenseDialogOpen(true)
    }

    function openEditExpenseDialog(expense: WorkcoverExpenseWithRelations) {
        setEditingExpenseId(expense.id)
        setExpenseForm({
            claim_id: expense.claim_id,
            supplier_id: expense.supplier_id,
            category_id: expense.category_id,
            description: expense.description,
            amount_charged: expense.amount_charged.toString(),
            amount_claimed: expense.amount_claimed?.toString() || '',
            expense_date: expense.expense_date,
            invoice_number: expense.invoice_number || '',
            status: expense.status,
            tags: expense.tags?.map(t => t.tag_name) || [],
        })
        setExpenseDialogOpen(true)
    }

    async function handleDeleteExpense(id: string) {
        if (!confirm('Are you sure you want to delete this expense?')) return
        try {
            await deleteWorkcoverExpense(id)
            loadData()
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    // Calculate totals
    const totalGap = claimSummaries.reduce((sum, claim) => sum + claim.total_gap, 0)
    const totalCharged = claimSummaries.reduce((sum, claim) => sum + claim.total_charged, 0)
    const totalReimbursed = claimSummaries.reduce((sum, claim) => sum + claim.total_reimbursed, 0)

    const filteredExpenses = expenses.filter(expense => {
        const matchesTags = filterTags.length === 0 || filterTags.every(t => expense.tags?.some(et => et.tag_name === t))
        return matchesTags
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
                    <h1 className="text-2xl font-bold tracking-tight">WorkCover</h1>
                    <p className="text-muted-foreground">
                        Manage WorkCover claims and medical expenses
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setClaimDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Claim
                    </Button>
                    <Button
                        onClick={openNewExpenseDialog}
                        disabled={claims.length === 0}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Gap</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">${totalGap.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Out-of-pocket expenses</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Charged</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCharged.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">All medical expenses</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reimbursed</CardTitle>
                        <Shield className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">${totalReimbursed.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Amount recovered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="claims">
                <TabsList>
                    <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="claims" className="mt-4">
                    {claims.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                                    <Shield className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">No claims yet</h3>
                                <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                                    Create your first WorkCover claim to start tracking expenses.
                                </p>
                                <Button
                                    onClick={() => setClaimDialogOpen(true)}
                                    className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Claim
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {claimSummaries.map((summary) => {
                                const claim = claims.find(c => c.id === summary.id)
                                if (!claim) return null
                                return (
                                    <Card key={claim.id} className="hover:border-indigo-500/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{claim.claim_number}</CardTitle>
                                                <Badge className={claimStatusColors[claim.status]}>
                                                    {claim.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Injury: {new Date(claim.injury_date).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Charged</p>
                                                    <p className="font-medium">${summary.total_charged.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Reimbursed</p>
                                                    <p className="font-medium text-emerald-600">${summary.total_reimbursed.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Gap</p>
                                                    <p className="font-medium text-amber-600">${summary.total_gap.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
                                                <span>{summary.expense_count} expenses</span>
                                                {summary.pending_count > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {summary.pending_count} pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="expenses" className="mt-4">
                    <div className="mb-4 w-full sm:w-[300px]">
                        <TagInput
                            selectedTags={filterTags}
                            onTagsChange={setFilterTags}
                            availableTags={availableTags}
                            placeholder="Filter by tags..."
                        />
                    </div>
                    {filteredExpenses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                                    <DollarSign className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">No expenses yet</h3>
                                <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                                    {claims.length === 0
                                        ? 'Create a claim first, then add medical expenses.'
                                        : 'Add your first medical expense to track reimbursements.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Claim</TableHead>
                                        <TableHead>Tags</TableHead>
                                        <TableHead className="text-right">Charged</TableHead>
                                        <TableHead className="text-right">Gap</TableHead>
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
                                            <TableCell>{expense.claim?.claim_number || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {expense.tags?.map(tag => (
                                                        <Badge key={tag.id} variant="secondary" className="text-xs px-1 h-5">
                                                            {tag.tag_name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${expense.amount_charged.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-amber-600">
                                                ${expense.gap_amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={expenseStatusColors[expense.status]}>
                                                    {expense.status.replace(/_/g, ' ')}
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
                                                        <DropdownMenuItem onClick={() => openEditExpenseDialog(expense)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteExpense(expense.id)}
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
                </TabsContent>
            </Tabs>

            {/* New Claim Dialog */}
            <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleCreateClaim}>
                        <DialogHeader>
                            <DialogTitle>New WorkCover Claim</DialogTitle>
                            <DialogDescription>
                                Create a new claim to track related medical expenses
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="claim_number">Claim Number *</Label>
                                <Input
                                    id="claim_number"
                                    value={claimForm.claim_number}
                                    onChange={(e) => setClaimForm(prev => ({ ...prev, claim_number: e.target.value }))}
                                    placeholder="WC-2024-001"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="injury_date">Injury Date *</Label>
                                    <Input
                                        id="injury_date"
                                        type="date"
                                        value={claimForm.injury_date}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, injury_date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={claimForm.status}
                                        onValueChange={(v) => setClaimForm(prev => ({ ...prev, status: v as WorkcoverClaimStatus }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="under_review">Under Review</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="injury_description">Injury Description</Label>
                                <Textarea
                                    id="injury_description"
                                    value={claimForm.injury_description}
                                    onChange={(e) => setClaimForm(prev => ({ ...prev, injury_description: e.target.value }))}
                                    placeholder="Describe the injury..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="insurer_name">Insurer Name</Label>
                                    <Input
                                        id="insurer_name"
                                        value={claimForm.insurer_name}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, insurer_name: e.target.value }))}
                                        placeholder="Insurance company"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="insurer_contact">Insurer Contact</Label>
                                    <Input
                                        id="insurer_contact"
                                        value={claimForm.insurer_contact}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, insurer_contact: e.target.value }))}
                                        placeholder="Phone or email"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setClaimDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Claim
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Expense Dialog */}
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmitExpense}>
                        <DialogHeader>
                            <DialogTitle>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                            <DialogDescription>
                                {editingExpenseId ? 'Update medical expense details' : 'Record a medical expense for this claim'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="claim">Claim *</Label>
                                <Select
                                    value={expenseForm.claim_id}
                                    onValueChange={(v) => setExpenseForm(prev => ({ ...prev, claim_id: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select claim" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {claims.map(claim => (
                                            <SelectItem key={claim.id} value={claim.id}>
                                                {claim.claim_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="GP consultation, physiotherapy, etc."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount_charged">Amount Charged *</Label>
                                    <Input
                                        id="amount_charged"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={expenseForm.amount_charged}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount_charged: e.target.value }))}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="amount_claimed">Amount Claimed</Label>
                                    <Input
                                        id="amount_claimed"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={expenseForm.amount_claimed}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount_claimed: e.target.value }))}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="expense_date">Date *</Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={expenseForm.expense_date}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={expenseForm.status}
                                        onValueChange={(v) => setExpenseForm(prev => ({ ...prev, status: v as WorkcoverExpenseStatus }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending_submission">Pending Submission</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <Select
                                        value={expenseForm.supplier_id || 'none'}
                                        onValueChange={(v) => setExpenseForm(prev => ({ ...prev, supplier_id: v === 'none' ? null : v }))}
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
                                        value={expenseForm.category_id || 'none'}
                                        onValueChange={(v) => setExpenseForm(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
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
                            <div className="grid gap-2">
                                <Label>Tags</Label>
                                <TagInput
                                    selectedTags={expenseForm.tags}
                                    onTagsChange={(tags) => setExpenseForm(prev => ({ ...prev, tags }))}
                                    availableTags={availableTags}
                                    placeholder="Add tags..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingExpenseId ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}
