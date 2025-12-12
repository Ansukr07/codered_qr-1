'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin-login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Red Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4a1f1f_1px,transparent_1px),linear-gradient(to_bottom,#4a1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-50 pointer-events-none" />

      <div className="relative z-10">
        <AdminSidebar />
        <main className="pl-64">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div> //sidebar type shit
    </div>
  )
}
