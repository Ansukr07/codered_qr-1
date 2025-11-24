import { Code2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Codered Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold">Codered 3.0</h1>
                <p className="text-xs text-muted-foreground">Volunteer Portal</p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
