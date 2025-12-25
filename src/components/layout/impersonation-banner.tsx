'use client'

import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getImpersonatingUserId, getImpersonatedUserProfile, stopImpersonation } from '@/lib/api/services'

interface ImpersonationBannerProps {
    collapsed?: boolean
}

export function ImpersonationBanner({ collapsed = false }: ImpersonationBannerProps) {
    const [impersonatedUser, setImpersonatedUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadImpersonation()
    }, [])

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

    if (loading || !impersonatedUser) return null

    if (collapsed) {
        return (
            <div className="p-2 border-t bg-amber-50 border-amber-200">
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={stopImpersonation}
                        title="Exit impersonation"
                    >
                        <User className="h-4 w-4 text-amber-600" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 border-t bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <User className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-900">Viewing as</p>
                    <p className="text-sm font-semibold text-amber-900 truncate">{impersonatedUser.display_name}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:bg-amber-100"
                    onClick={stopImpersonation}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
