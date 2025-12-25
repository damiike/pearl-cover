'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Eye, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getUsers, updateUserRole, deleteUser, startImpersonation } from '@/lib/api/services'
import type { Profile, UserRole } from '@/lib/types/database'
import { toast } from 'sonner'

const roleColors: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800',
    owner: 'bg-blue-100 text-blue-800',
    support: 'bg-green-100 text-green-800',
    read_only: 'bg-gray-100 text-gray-800',
    supplier: 'bg-amber-100 text-amber-800',
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    owner: 'Owner',
    support: 'Support',
    read_only: 'Read Only',
    supplier: 'Supplier',
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            setLoading(true)
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: UserRole) {
        try {
            await updateUserRole(userId, newRole)
            toast.success('User role updated')
            loadUsers()
        } catch (error) {
            console.error('Failed to update role:', error)
            toast.error('Failed to update role')
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            await deleteUser(userId)
            toast.success('User deleted')
            loadUsers()
        } catch (error) {
            console.error('Failed to delete user:', error)
            toast.error('Failed to delete user')
        }
    }

    async function handleViewAsUser(userId: string) {
        startImpersonation(userId)
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
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage user roles and permissions</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        {users.length} Users
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View and manage user roles</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.display_name}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {user.id.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={user.role}
                                                onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            <Badge className={roleColors[role]}>
                                                                {roleLabels[role]}
                                                            </Badge>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewAsUser(user.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
