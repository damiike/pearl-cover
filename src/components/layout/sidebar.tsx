'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/providers'
import { getUserEffectivePermissions } from '@/lib/api/admin/index'
import {
    Home,
    Heart,
    Shield,
    CreditCard,
    Calendar as CalendarIcon,
    FileText,
    Building2,
    BarChart3,
    Search,
    History,
    Settings,
    Menu,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Camera,
    Sparkles,
} from 'lucide-react'
import { ImpersonationBanner } from './impersonation-banner'

interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
}

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: Home },
    { title: 'Aged Care', href: '/aged-care', icon: Heart },
    { title: 'WorkCover', href: '/workcover', icon: Shield },
    { title: 'Payments', href: '/payments', icon: CreditCard },
    { title: 'Notes', href: '/notes', icon: FileText },
    { title: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { title: 'Suppliers', href: '/suppliers', icon: Building2 },
]

const secondaryNavItems: NavItem[] = [
    { title: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
    { title: 'Reports', href: '/reports', icon: BarChart3 },
    { title: 'Search', href: '/search', icon: Search },
    { title: 'Audit Log', href: '/audit-log', icon: History },
    { title: 'Settings', href: '/settings', icon: Settings },
]

const adminNavItems: NavItem[] = [
    { title: 'Admin', href: '/admin/users', icon: Shield },
]

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const pathname = usePathname()
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.title : undefined}
        >
            <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
            {!collapsed && (
                <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge !== undefined && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    )
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
    const { user } = useAuth()
    const [canViewAdmin, setCanViewAdmin] = useState(false)

    useEffect(() => {
        if (user?.id) {
            getUserEffectivePermissions(user.id, '/admin/users')
                .then(perms => setCanViewAdmin(perms.canView))
                .catch(err => console.error('Failed to check admin permissions:', err))
        }
    }, [user?.id])

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={cn(
                'flex h-16 items-center border-b px-4',
                collapsed && 'justify-center px-2'
            )}>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Heart className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Pearl Cover
                        </span>
                    )}
                </Link>
                {onCollapse && !collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8"
                        onClick={onCollapse}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                <div className="space-y-1">
                    {mainNavItems.map((item) => (
                        <NavLink key={item.href} item={item} collapsed={collapsed} />
                    ))}
                </div>

                <div className="my-4 border-t" />

                <div className="space-y-1">
                    {secondaryNavItems.map((item) => (
                        <NavLink key={item.href} item={item} collapsed={collapsed} />
                    ))}
                </div>

                {/* Admin section - only show if user has permission */}
                {canViewAdmin && (
                    <>
                        <div className="my-4 border-t" />
                        <div className="space-y-1">
                            {adminNavItems.map((item) => (
                                <NavLink key={item.href} item={item} collapsed={collapsed} />
                            ))}
                        </div>
                    </>
                )}
            </nav>

            {/* Expand button when collapsed */}
            {onCollapse && collapsed && (
                <div className="border-t p-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-full"
                        onClick={onCollapse}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const { user, signOut } = useAuth()

    const userInitials = user?.email
        ?.split('@')[0]
        .slice(0, 2)
        .toUpperCase() ?? 'U'

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn(
                'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}>
                <SidebarContent
                    collapsed={collapsed}
                    onCollapse={() => setCollapsed(!collapsed)}
                />

                {/* Impersonation Indicator */}
                <ImpersonationBanner collapsed={collapsed} />

                {/* User menu */}
                <div className={cn(
                    'border-t p-3',
                    collapsed && 'flex justify-center'
                )}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    'w-full justify-start gap-2',
                                    collapsed && 'w-auto p-2'
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                {!collapsed && (
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-medium truncate max-w-[140px]">
                                            {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                                        </span>
                                    </div>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden flex h-14 items-center gap-4 border-b bg-card px-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <SidebarContent collapsed={false} />
                    </SheetContent>
                </Sheet>

                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Heart className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Pearl Cover
                    </span>
                </Link>

                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/upload">
                            <Camera className="h-5 w-5" />
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </>
    )
}
