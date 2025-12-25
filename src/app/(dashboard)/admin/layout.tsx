'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        // Check if user is admin
        // We'll get this from profile after auth context is updated
        const checkAdmin = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin') {
                setIsAuthorized(true)
            } else {
                router.push('/dashboard')
            }
        }

        checkAdmin()
    }, [user, router])

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Checking permissions...</h2>
                </div>
            </div>
        )
    }

    return <div className="space-y-6">{children}</div>
}
