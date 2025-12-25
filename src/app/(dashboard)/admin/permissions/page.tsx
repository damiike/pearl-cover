'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Checkbox } from '@/components/ui/checkbox'
import { getPages, getRolePermissions, updateRolePermission } from '@/lib/api/services'
import type { Page, UserRole } from '@/lib/types/database'
import { toast } from 'sonner'

const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    owner: 'Owner',
    support: 'Support',
    read_only: 'Read Only',
    supplier: 'Supplier',
}

export default function AdminRolesPage() {
    const [pages, setPages] = useState<Page[]>([])
    const [permissions, setPermissions] = useState<any[]>([])
    const [selectedRole, setSelectedRole] = useState<UserRole>('owner')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (permissions.length > 0) {
            // Filter permissions when role changes
            loadData()
        }
    }, [selectedRole])

    async function loadData() {
        try {
            setLoading(true)
            const [pagesData, permsData] = await Promise.all([
                getPages(),
                getRolePermissions(selectedRole)
            ])
            setPages(pagesData)
            setPermissions(permsData)
        } catch (error) {
            console.error('Failed to load data:', error)
            toast.error('Failed to load permissions')
        } finally {
            setLoading(false)
        }
    }

    async function handlePermissionChange(
        permissionId: string,
        field: 'can_view' | 'can_create' | 'can_update' | 'can_delete',
        value: boolean
    ) {
        try {
            await updateRolePermission(permissionId, { [field]: value })
            toast.success('Permission updated')
            loadData()
        } catch (error) {
            console.error('Failed to update permission:', error)
            toast.error('Failed to update permission')
        }
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
                    <h1 className="text-2xl font-bold tracking-tight">Role Permissions</h1>
                    <p className="text-muted-foreground">Configure page access for each role</p>
                </div>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                    <SelectTrigger className="w-[180px]">
                        <Shield className="mr-2 h-4 w-4" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                                {roleLabels[role]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Permissions Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle>Page Permissions for {roleLabels[selectedRole]}</CardTitle>
                    <CardDescription>
                        Configure CRUD permissions for each page
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Page</TableHead>
                                    <TableHead className="text-center">View</TableHead>
                                    <TableHead className="text-center">Create</TableHead>
                                    <TableHead className="text-center">Update</TableHead>
                                    <TableHead className="text-center">Delete</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissions.map((perm: any) => (
                                    <TableRow key={perm.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{perm.pages?.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    /{perm.pages?.slug}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_view}
                                                onCheckedChange={(checked) =>
                                                    handlePermissionChange(perm.id, 'can_view', checked as boolean)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_create}
                                                onCheckedChange={(checked) =>
                                                    handlePermissionChange(perm.id, 'can_create', checked as boolean)
                                                }
                                                disabled={!perm.can_view}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_update}
                                                onCheckedChange={(checked) =>
                                                    handlePermissionChange(perm.id, 'can_update', checked as boolean)
                                                }
                                                disabled={!perm.can_view}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_delete}
                                                onCheckedChange={(checked) =>
                                                    handlePermissionChange(perm.id, 'can_delete', checked as boolean)
                                                }
                                                disabled={!perm.can_view}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
