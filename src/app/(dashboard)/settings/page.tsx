'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Bell, Shield, Loader2, Save, Calendar as CalendarIcon, Check, X, Trash2, AlertTriangle, Sparkles, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers'
import {
    getPages,
    getRolePermissions,
    deleteUser,
    deleteUserData,
    deleteAllSystemData,
    getAIConfiguration,
    saveAIConfiguration,
} from '@/lib/api/admin/index'
import { testChatGPTConnection } from '@/lib/ai/chatgpt'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'

export default function SettingsPage() {
    const { user } = useAuth()
    const [saving, setSaving] = useState(false)
    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '')
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [permissions, setPermissions] = useState<any[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteType, setDeleteType] = useState<'user' | 'system'>('user')
    const [deleting, setDeleting] = useState(false)
    const [chatGptApiKey, setChatGptApiKey] = useState('')
    const [aiEndpointUrl, setAiEndpointUrl] = useState('https://api.openai.com/v1')
    const [aiModelName, setAiModelName] = useState('gpt-4-turbo-preview')
    const [showApiKey, setShowApiKey] = useState(false)
    const [savingApiKey, setSavingApiKey] = useState(false)
    const [testingApiKey, setTestingApiKey] = useState(false)
    const [notifications, setNotifications] = useState({
        email: true,
        claimUpdates: true,
        paymentReminders: true,
    })

    async function handleSaveProfile() {
        if (!user?.id) return
        setSaving(true)
        try {
            await updateProfile(user.id, { display_name: displayName })
            // Show success feedback
        } catch (error) {
            console.error('Failed to save profile:', error)
        } finally {
            setSaving(false)
        }
    }

    const [googleUser, setGoogleUser] = useState<string | null>(null)

    // Check for Google Connection
    useEffect(() => {
        const checkConnection = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.provider_token) {
                try {
                    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { Authorization: `Bearer ${session.provider_token}` }
                    })
                    if (response.ok) {
                        const data = await response.json()
                        setGoogleUser(data.email)
                    }
                } catch (e) {
                    console.error("Failed to fetch Google user", e)
                }
            }
        }
        checkConnection()
    }, [])

    // Load AI configuration
    useEffect(() => {
        async function loadAIConfig() {
            if (!user?.id) return
            try {
                const config = await getAIConfiguration(user.id)
                if (config.apiKey) setChatGptApiKey(config.apiKey)
                setAiEndpointUrl(config.endpointUrl)
                setAiModelName(config.modelName)
            } catch (error) {
                console.error('Failed to load AI config:', error)
            }
        }
        loadAIConfig()
    }, [user])

    // Load user role and permissions
    useEffect(() => {
        const loadRoleAndPermissions = async () => {
            if (!user?.id) return
            try {
                setLoadingPermissions(true)
                const supabase = createClient()

                // Get user's role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setUserRole(profile.role as UserRole)

                    // Get role permissions
                    const perms = await getRolePermissions(profile.role)
                    setPermissions(perms)
                }
            } catch (error) {
                console.error('Failed to load role/permissions:', error)
            } finally {
                setLoadingPermissions(false)
            }
        }
        loadRoleAndPermissions()
    }, [user])

    async function handleDeleteData() {
        if (!user?.id) return
        setDeleting(true)
        try {
            if (deleteType === 'system') {
                await deleteAllSystemData()
                toast.success('All system data deleted successfully')
            } else {
                await deleteUserData(user.id)
                toast.success('Your data has been deleted successfully')
            }
            setDeleteDialogOpen(false)
            setTimeout(() => window.location.reload(), 1000)
        } catch (error: any) {
            console.error('Failed to delete data:', error)
            toast.error(error.message || 'Failed to delete data')
        } finally {
            setDeleting(false)
        }
    }

    async function handleConnectGoogle() {
        if (!user) return
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/calendar`
            }
        })
    }

    async function handleDisconnectGoogle() {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
            try {
                // Revoke token at Google
                await fetch(`https://oauth2.googleapis.com/revoke?token=${session.provider_token}`, {
                    method: 'POST',
                    headers: { 'Content-type': 'application/x-www-form-urlencoded' }
                })
            } catch (e) {
                console.error("Error revoking token", e)
            }
        }
        // Do NOT sign out the user from the app.
        // Just clear the local Google User state so the UI updates to "Connect"
        setGoogleUser(null)
    }

    async function handleSaveApiKey() {
        if (!user?.id) return
        setSavingApiKey(true)
        try {
            await saveAIConfiguration(user.id, chatGptApiKey, aiEndpointUrl, aiModelName)
            toast.success('AI configuration saved successfully')
        } catch (error) {
            console.error('Failed to save configuration:', error)
            toast.error('Failed to save configuration')
        } finally {
            setSavingApiKey(false)
        }
    }

    async function handleTestApiKey() {
        setTestingApiKey(true)
        try {
            const isValid = await testChatGPTConnection(chatGptApiKey, aiEndpointUrl, aiModelName)
            if (isValid) {
                toast.success('Connection successful!')
            } else {
                toast.error('Failed to connect. Check your configuration.')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to test connection')
        } finally {
            setTestingApiKey(false)
        }
    }

    async function handleRemoveApiKey() {
        if (!user?.id) return
        try {
            await removeChatGPTApiKey(user.id)
            setChatGptApiKey('')
            setAiEndpointUrl('https://api.openai.com/v1')
            setAiModelName('gpt-4-turbo-preview')
            toast.success('Configuration removed')
        } catch (error) {
            console.error('Failed to remove configuration:', error)
            toast.error('Failed to remove configuration')
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Profile</CardTitle>
                    </div>
                    <CardDescription>Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Role & Permissions Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Role & Permissions</CardTitle>
                    </div>
                    <CardDescription>Your access level and permitted actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingPermissions ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="font-medium">Your Role</p>
                                    <p className="text-sm text-muted-foreground">Determines your access level</p>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1">
                                    {userRole?.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <p className="font-medium">Page Permissions</p>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Pages you can access and actions you can perform
                                </p>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {permissions.map((perm: any) => (
                                        <div key={perm.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{perm.pages?.name}</p>
                                                <p className="text-xs text-muted-foreground">/{perm.pages?.slug}</p>
                                            </div>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                {perm.can_view && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Check className="h-3 w-3 mr-1" /> View
                                                    </Badge>
                                                )}
                                                {perm.can_create && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Check className="h-3 w-3 mr-1" /> Create
                                                    </Badge>
                                                )}
                                                {perm.can_update && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Check className="h-3 w-3 mr-1" /> Update
                                                    </Badge>
                                                )}
                                                {perm.can_delete && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Check className="h-3 w-3 mr-1" /> Delete
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch
                            checked={notifications.email}
                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Claim Updates</p>
                            <p className="text-sm text-muted-foreground">Get notified when claims are updated</p>
                        </div>
                        <Switch
                            checked={notifications.claimUpdates}
                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, claimUpdates: checked }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Payment Reminders</p>
                            <p className="text-sm text-muted-foreground">Receive payment due date reminders</p>
                        </div>
                        <Switch
                            checked={notifications.paymentReminders}
                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentReminders: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Security</CardTitle>
                    </div>
                    <CardDescription>Manage your security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline">Change Password</Button>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        <CardTitle>AI Assistant</CardTitle>
                    </div>
                    <CardDescription>Configure your OpenAI-compatible endpoint for natural language search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="endpoint-url">Endpoint URL</Label>
                        <Input
                            id="endpoint-url"
                            value={aiEndpointUrl}
                            onChange={(e) => setAiEndpointUrl(e.target.value)}
                            placeholder="https://api.openai.com/v1"
                        />
                        <p className="text-sm text-muted-foreground">
                            Base URL only (not including /chat/completions)
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Examples: <code className="bg-muted px-1 rounded">https://api.openai.com/v1</code> or <code className="bg-muted px-1 rounded">https://openrouter.ai/api/v1</code>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="model-name">Model Name</Label>
                        <Input
                            id="model-name"
                            value={aiModelName}
                            onChange={(e) => setAiModelName(e.target.value)}
                            placeholder="gpt-4-turbo-preview"
                        />
                        <p className="text-sm text-muted-foreground">
                            Model available at your endpoint (e.g., gpt-4, claude-3-sonnet, etc.)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="api-key"
                                    type={showApiKey ? 'text' : 'password'}
                                    value={chatGptApiKey}
                                    onChange={(e) => setChatGptApiKey(e.target.value)}
                                    placeholder="sk-..."
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            API key for your selected endpoint
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSaveApiKey}
                            disabled={savingApiKey || !chatGptApiKey.trim()}
                        >
                            {savingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Configuration
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleTestApiKey}
                            disabled={testingApiKey || !chatGptApiKey.trim()}
                        >
                            {testingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Test Connection
                        </Button>
                        {chatGptApiKey && (
                            <Button
                                variant="outline"
                                onClick={handleRemoveApiKey}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Calendar Integrations */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Calendar Integrations</CardTitle>
                    </div>
                    <CardDescription>Connect your external calendars for real-time syncing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                            </div>
                            <div>
                                <p className="font-medium">Google Calendar</p>
                                <p className="text-sm text-muted-foreground">
                                    {googleUser ? `Connected as ${googleUser}` : 'Sync events from your Google Calendar'}
                                </p>
                            </div>
                        </div>
                        {googleUser ? (
                            <Button variant="destructive" size="sm" onClick={handleDisconnectGoogle}>Disconnect</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={handleConnectGoogle}>Connect</Button>
                        )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <div>
                                <p className="font-medium">Outlook Calendar</p>
                                <p className="text-sm text-muted-foreground">Sync events from your Outlook Calendar</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>User ID: <span className="font-mono text-xs select-all break-all">{user?.id}</span></p>
                    <p>Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                    <p>Last Sign In: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                </CardContent>
            </Card>

            {/* Danger Zone - Only for admin/owner */}
            {(userRole === 'admin' || userRole === 'owner') && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Irreversible actions that permanently delete data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Delete My Data</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Permanently delete all your notes, expenses, claims, payments, calendar events, and attachments.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setDeleteType('user')
                                    setDeleteDialogOpen(true)
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete My Data
                            </Button>
                        </div>

                        {userRole === 'admin' && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-medium mb-2">Delete All System Data</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Permanently delete ALL data from ALL users. This will reset the entire system.
                                    </p>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setDeleteType('system')
                                            setDeleteDialogOpen(true)
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete All System Data
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Data Deletion
                        </DialogTitle>
                        <DialogDescription>
                            {deleteType === 'system' ? (
                                <div className="space-y-2 mt-2">
                                    <p className="font-semibold">⚠️ This will permanently delete ALL system data including:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>All user data (notes, expenses, claims, payments)</li>
                                        <li>All calendar events</li>
                                        <li>All attachments and files</li>
                                        <li>All audit logs</li>
                                    </ul>
                                    <p className="text-destructive font-semibold mt-3">This action cannot be undone!</p>
                                </div>
                            ) : (
                                <div className="space-y-2 mt-2">
                                    <p className="font-semibold">This will permanently delete:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>All your notes and tags</li>
                                        <li>All your expenses (aged care & workcover)</li>
                                        <li>All your workcover claims</li>
                                        <li>All your payment transactions</li>
                                        <li>All your calendar events</li>
                                        <li>All your attachments</li>
                                    </ul>
                                    <p className="text-destructive font-semibold mt-3">This action cannot be undone!</p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteData}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Yes, Delete {deleteType === 'system' ? 'All Data' : 'My Data'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
