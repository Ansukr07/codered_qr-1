'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'admin' | 'team'>('team')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'volunteer') {
        router.push('/volunteer')
      } else if (user.role === 'participant') {
        router.push('/participant')
      }
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (role === 'team') {
        // For team/participant, Name + Code
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, code })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        window.location.href = '/participant';
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Don't render login form if user is already authenticated (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Codered Logo" className="w-12 h-12 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to Code Red 3.0 Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setRole('team')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'team'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Users className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Team</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'admin'
                  ? 'bg-red-500/10 border-red-500 text-red-500'
                  : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Shield className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Admin</span>
              </button>
            </div>

            {role === 'team' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="e.g. CRU-T01-P01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6 bg-secondary/20">
          <div className="w-full text-center">
            <p className="text-xs text-muted-foreground mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-secondary/50 border border-border/50">
                <p className="font-semibold text-red-400">Admin</p>
                <p className="text-muted-foreground mt-1">demo@admin.com</p>
                <p className="text-muted-foreground">admin123</p>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border/50">
                <p className="font-semibold text-primary">Team</p>
                <p className="text-muted-foreground mt-1">Participant Name</p>
                <p className="text-muted-foreground">CRU-...</p>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
