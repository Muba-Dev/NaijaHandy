'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { fetchMe } from '@/lib/api'
import { getStoredUser, isAuthenticated } from '@/lib/utils'
import type { AuthUser } from '@/types'

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: AuthUser['role'][]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!isAuthenticated()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const user = getStoredUser<AuthUser>() ?? (await fetchMe())
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          const fallback = user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer'
          router.replace(fallback)
          return
        }
        if (!cancelled) setVerified(true)
      } catch {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [pathname, allowedRoles, router])

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#047857] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Checking your session…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
