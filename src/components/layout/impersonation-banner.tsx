'use client'

import { useState, useEffect } from 'react'
import { X, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getImpersonatingUserId, getImpersonatedUserProfile, stopImpersonation } from '@/lib/api/admin/index'

interface ImpersonationBannerProps {
    collapsed?: boolean
}

export function ImpersonationBanner({ collapsed = false }: ImpersonationBannerProps) {
    const [impersonatedUser, setImpersonatedUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadImpersonation() {
            try {
                const userId = getImpersonatingUserId()
                if (userId) {
                    const user = await getImpersonatedUserProfile(userId)
                    setImpersonatedUser(user)
                }
            } catch (error) {
                console.error('Failed to load impersonated user:', error)
            } finally {
                setLoading(false)
            }
        }
        loadImpersonation()
    }, [])

    if (loading || !impersonatedUser) {
        return null
    }

    return (
        <div className={cn(
            'bg-indigo-600 text-white',
            collapsed && 'justify-center px-2'
        )}>
            <div className="container mx-auto flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <div>
                        <p className="text-sm font-medium">
                            Viewing as: <span className="font-bold">{impersonatedUser.display_name}</span>
                        </p>
                        <Badge variant="secondary" className="ml-2">
                            {impersonatedUser.role}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={stopImpersonation}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
