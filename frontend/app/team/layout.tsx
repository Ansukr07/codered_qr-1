'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Code2, LogOut, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'participant')) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || user.role !== 'participant') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Codered Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold">Code Red 3.0</h1>
                <p className="text-xs text-muted-foreground">Team Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/team/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
