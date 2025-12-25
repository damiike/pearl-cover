'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFundingAccounts, createFundingAccount, updateFundingAccount, deleteFundingAccount } from '@/lib/api/services'
import { toast } from 'sonner'

interface FundingAccount {
    id: string
    account_name: string
    funding_type: 'home_care_package' | 'support_at_home' | 'other'
    funding_level: string | null
    start_date: string | null
    provider_name: string | null
    provider_contact: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<FundingAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        account_name: '',
        funding_type: 'home_care_package' as 'home_care_package' | 'support_at_home' | 'other',
        funding_level: '',
        start_date: '',
        provider_name: '',
        provider_contact: '',
        is_active: true
    })

    useEffect(() => {
        loadAccounts()
    }, [])

    async function loadAccounts() {
        try {
            setLoading(true)
            const data = await getFundingAccounts(false) // Get all accounts, not just active
            setAccounts(data)
        } catch (error) {
            console.error('Failed to load accounts:', error)
            toast.error('Failed to load accounts')
        } finally {
            setLoading(false)
        }
    }

    function openCreateDialog() {
        setEditingId(null)
        setFormData({
            account_name: '',
            funding_type: 'home_care_package',
            funding_level: '',
            start_date: '',
            provider_name: '',
            provider_contact: '',
            is_active: true
        })
        setDialogOpen(true)
    }

    function openEditDialog(account: FundingAccount) {
        setEditingId(account.id)
        setFormData({
            account_name: account.account_name,
            funding_type: account.funding_type,
            funding_level: account.funding_level || '',
            start_date: account.start_date || '',
            provider_name: account.provider_name || '',
            provider_contact: account.provider_contact || '',
            is_active: account.is_active
        })
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const data = {
                account_name: formData.account_name,
                funding_type: formData.funding_type,
                funding_level: formData.funding_level || null,
                start_date: formData.start_date || null,
                provider_name: formData.provider_name || null,
                provider_contact: formData.provider_contact || null,
                is_active: formData.is_active
            }

            if (editingId) {
                await updateFundingAccount(editingId, data)
                toast.success('Account updated successfully')
            } else {
                await createFundingAccount(data)
                toast.success('Account created successfully')
            }

            setDialogOpen(false)
            loadAccounts()
        } catch (error) {
            console.error('Failed to save account:', error)
            toast.error('Failed to save account')
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleActive(account: FundingAccount) {
        try {
            await updateFundingAccount(account.id, { is_active: !account.is_active })
            toast.success(account.is_active ? 'Account deactivated' : 'Account activated')
            loadAccounts()
        } catch (error) {
            console.error('Failed to update account:', error)
            toast.error('Failed to update account')
        }
    }

    async function handleDelete() {
        if (!deletingId) return
        try {
            await deleteFundingAccount(deletingId)
            toast.success('Account deleted successfully')
            setDeleteDialogOpen(false)
            setDeletingId(null)
            loadAccounts()
        } catch (error: any) {
            console.error('Failed to delete account:', error)
            toast.error(error.message || 'Failed to delete account')
        }
    }

    const fundingTypeLabels = {
        home_care_package: 'Home Care Package',
        support_at_home: 'Support at Home',
        other: 'Other'
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
                    <p className="text-muted-foreground">Manage your funding accounts</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <Card key={account.id} className={!account.is_active ? 'opacity-60' : ''}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{account.account_name}</CardTitle>
                                        <CardDescription>{account.provider_name || 'No provider'}</CardDescription>
                                    </div>
                                    <Badge variant={account.is_active ? 'default' : 'secondary'}>
                                        {account.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">Funding Type</p>
                                        <p className="text-sm text-muted-foreground">
                                            {fundingTypeLabels[account.funding_type]}
                                        </p>
                                    </div>
                                    {account.funding_level && (
                                        <div>
                                            <p className="text-sm font-medium">Level</p>
                                            <p className="text-sm text-muted-foreground">{account.funding_level}</p>
                                        </div>
                                    )}
                                    {account.start_date && (
                                        <div>
                                            <p className="text-sm font-medium">Start Date</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(account.start_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={account.is_active}
                                                onCheckedChange={() => handleToggleActive(account)}
                                            />
                                            <span className="text-sm text-muted-foreground">Active</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openEditDialog(account)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    setDeletingId(account.id)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Account' : 'New Account'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Update account details' : 'Create a new funding account'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Account Name *</Label>
                                <Input
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    placeholder="My Aged Care HCP Level 4"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Funding Type *</Label>
                                <Select
                                    value={formData.funding_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, funding_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home_care_package">Home Care Package</SelectItem>
                                        <SelectItem value="support_at_home">Support at Home</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Funding Level</Label>
                                <Input
                                    value={formData.funding_level}
                                    onChange={(e) => setFormData({ ...formData, funding_level: e.target.value })}
                                    placeholder="Level 4"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Provider Name</Label>
                                <Input
                                    value={formData.provider_name}
                                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                    placeholder="My Aged Care"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Provider Contact</Label>
                                <Input
                                    value={formData.provider_contact}
                                    onChange={(e) => setFormData({ ...formData, provider_contact: e.target.value })}
                                    placeholder="1800 200 422"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label>Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
