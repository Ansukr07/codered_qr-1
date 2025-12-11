'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Code2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'volunteer' && user.role !== 'admin'))) {
      router.push('/volunteer-login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || (user.role !== 'volunteer' && user.role !== 'admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Red Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4a1f1f_1px,transparent_1px),linear-gradient(to_bottom,#4a1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative z-10">
        {/* Top Header */}
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Codered Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-primary">Code Red 3.0</h1>
                  <p className="text-xs text-muted-foreground">Volunteer Portal</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
