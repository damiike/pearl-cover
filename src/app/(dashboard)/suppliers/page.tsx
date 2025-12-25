'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Plus, Search, Filter, Loader2, Trash2, Edit, MoreHorizontal, Phone, Mail, MapPin, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/api/services'
import type { Supplier, SupplierType } from '@/lib/types/database'

const typeColors: Record<SupplierType, string> = {
    medical: 'bg-red-100 text-red-800',
    allied_health: 'bg-blue-100 text-blue-800',
    equipment: 'bg-purple-100 text-purple-800',
    transport: 'bg-amber-100 text-amber-800',
    care_services: 'bg-emerald-100 text-emerald-800',
    other: 'bg-slate-100 text-slate-800',
}

const typeLabels: Record<SupplierType, string> = {
    medical: 'Medical',
    allied_health: 'Allied Health',
    equipment: 'Equipment',
    transport: 'Transport',
    care_services: 'Care Services',
    other: 'Other',
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const [formData, setFormData] = useState({
        name: '',
        supplier_type: 'medical' as SupplierType,
        abn: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        billing_info: '',
        is_active: true,
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const data = await getSuppliers(false) // Get all suppliers, not just active
            setSuppliers(data)
        } catch (error) {
            console.error('Failed to load suppliers:', error)
        } finally {
            setLoading(false)
        }
    }

    function openNewDialog() {
        setEditingId(null)
        setFormData({
            name: '',
            supplier_type: 'medical',
            abn: '',
            contact_name: '',
            phone: '',
            email: '',
            address: '',
            billing_info: '',
            is_active: true,
        })
        setDialogOpen(true)
    }

    function openEditDialog(supplier: Supplier) {
        setEditingId(supplier.id)
        setFormData({
            name: supplier.name,
            supplier_type: supplier.supplier_type,
            abn: supplier.abn || '',
            contact_name: supplier.contact_name || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            billing_info: supplier.billing_info || '',
            is_active: supplier.is_active,
        })
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const data = {
                name: formData.name,
                supplier_type: formData.supplier_type,
                abn: formData.abn || null,
                contact_name: formData.contact_name || null,
                phone: formData.phone || null,
                email: formData.email || null,
                address: formData.address || null,
                billing_info: formData.billing_info || null,
                is_active: formData.is_active,
            }

            if (editingId) {
                await updateSupplier(editingId, data)
            } else {
                await createSupplier(data)
            }

            setDialogOpen(false)
            loadData()
        } catch (error) {
            console.error('Failed to save supplier:', error)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this supplier?')) return
        try {
            await deleteSupplier(id)
            loadData()
        } catch (error) {
            console.error('Failed to delete supplier:', error)
        }
    }

    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'all' || s.supplier_type === typeFilter
        return matchesSearch && matchesType
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
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your supplier directory</p>
                </div>
                <Button
                    onClick={openNewDialog}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search suppliers..."
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
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="allied_health">Allied Health</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="care_services">Care Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Suppliers List */}
            {filteredSuppliers.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <Building2 className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No suppliers yet</h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            Add your first supplier to start building your directory.
                        </p>
                        <Button
                            onClick={openNewDialog}
                            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Supplier
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredSuppliers.map(supplier => (
                        <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
                            <Card
                                className={`cursor-pointer hover:border-indigo-500/50 transition-all ${!supplier.is_active ? 'opacity-60' : ''}`}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-600/10 shrink-0">
                                        <Building2 className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-semibold">{supplier.name}</h3>
                                            <Badge className={typeColors[supplier.supplier_type]}>
                                                {typeLabels[supplier.supplier_type]}
                                            </Badge>
                                            {!supplier.is_active && (
                                                <Badge variant="outline">Inactive</Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            {supplier.contact_name && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {supplier.contact_name}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                            {supplier.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="truncate max-w-[200px]">{supplier.email}</span>
                                                </div>
                                            )}
                                            {supplier.address && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-[200px]">{supplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(supplier); }}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Update supplier details' : 'Add a new supplier to your directory'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Supplier name"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type *</Label>
                                    <Select
                                        value={formData.supplier_type}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_type: v as SupplierType }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="medical">Medical</SelectItem>
                                            <SelectItem value="allied_health">Allied Health</SelectItem>
                                            <SelectItem value="equipment">Equipment</SelectItem>
                                            <SelectItem value="transport">Transport</SelectItem>
                                            <SelectItem value="care_services">Care Services</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>ABN</Label>
                                    <Input
                                        value={formData.abn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                                        placeholder="XX XXX XXX XXX"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Contact Name</Label>
                                    <Input
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Address</Label>
                                <Textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
