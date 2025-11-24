'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Code2, Shield, Users, QrCode, ArrowLeft, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import QRCodeSVG from 'react-qr-code'

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('participant')
    const [teamId, setTeamId] = useState('')
    const [error, setError] = useState('')
    const [registeredUser, setRegisteredUser] = useState<any>(null)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const result = await register(name, email, password, role, teamId || undefined)
            setRegisteredUser(result.user)
        } catch (err: any) {
            setError(err.message || 'Registration failed')
        } finally {
            setIsLoading(false)
        }
    }

    const downloadQR = () => {
        const svg = document.getElementById('qr-code')
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()
            img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx?.drawImage(img, 0, 0)
                const pngFile = canvas.toDataURL('image/png')
                const downloadLink = document.createElement('a')
                downloadLink.download = `${registeredUser.name}-qr-code.png`
                downloadLink.href = pngFile
                downloadLink.click()
            }
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
        }
    }

    if (registeredUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-50" />

                <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500 text-white">
                                <QrCode className="w-7 h-7" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Registration Successful!</CardTitle>
                        <CardDescription>
                            Your account has been created. Save this QR code for resource access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="p-4 bg-white rounded-lg">
                                <QRCodeSVG
                                    id="qr-code"
                                    value={registeredUser.qrCode}
                                    size={200}
                                    level="H"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">{registeredUser.name}</p>
                                <p className="text-xs text-muted-foreground">{registeredUser.email}</p>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">{registeredUser.qrCode}</p>
                            </div>
                            <Button onClick={downloadQR} variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download QR Code
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-border/50 pt-6">
                        <Button onClick={() => router.push('/login')} className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-50" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/logo.png" alt="Codered Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>
                        Register for Codered 3.0
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-secondary/50 border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
                                required
                                className="bg-secondary/50 border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="bg-secondary/50 border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="participant">Participant</SelectItem>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role === 'participant' && (
                            <div className="space-y-2">
                                <Label htmlFor="teamId">Team ID (Optional)</Label>
                                <Input
                                    id="teamId"
                                    placeholder="team-001"
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="bg-secondary/50 border-border/50"
                                />
                            </div>
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
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/50 pt-6">
                    <p className="text-xs text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
