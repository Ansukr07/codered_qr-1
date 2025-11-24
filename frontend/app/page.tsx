import Link from 'next/link'
import { Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Grid Background */}
      <div className="relative overflow-hidden min-h-screen flex flex-col">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border/40 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Codered Logo" className="w-10 h-10 object-contain" />
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Code Red 3.0</h1>
                    <p className="text-xs text-muted-foreground">by E-Cell BMSIT</p>
                  </div>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Content */}
          <div className="container mx-auto px-4 flex-1 flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold text-balance">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Code Red 3.0
                </span>
              </h1>
              <div className="pt-4">
                <Link href="/login">
                  <Button size="lg" className="text-2xl md:text-3xl px-12 py-8 h-auto">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Code Red 3.0</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A QR-based resource tracking platform powered by E-Cell BMSIT.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
