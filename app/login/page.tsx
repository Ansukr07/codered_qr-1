'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Code2, Shield, Users, QrCode, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'admin' | 'volunteer' | 'team'>('team')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      // Redirect is handled inside the login function
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
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
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
              <Code2 className="w-7 h-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to Codered 3.0 Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-2 mb-6">
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
                onClick={() => setRole('volunteer')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'volunteer'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <QrCode className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Volunteer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'admin'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                  : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Shield className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Admin</span>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
      </Card>
    </div>
  )
}
