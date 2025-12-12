'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Github, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const SUBMISSION_LOCKED = true // Set to false when submissions are open

export default function SubmissionPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [githubLink, setGithubLink] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentGithubLink, setCurrentGithubLink] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && user.role === 'participant') {
            fetchGithubLink()
        }
    }, [user])

    const fetchGithubLink = async () => {
        try {
            const res = await fetch('/api/participant/github')
            if (res.ok) {
                const data = await res.json()
                setCurrentGithubLink(data.githubLink)
                setGithubLink(data.githubLink || '')
            }
        } catch (error) {
            console.error('Failed to fetch GitHub link:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (SUBMISSION_LOCKED) {
            toast({
                title: 'Submissions Locked',
                description: 'Submissions are currently locked. Please wait for further instructions.',
                variant: 'destructive',
            })
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/participant/github', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubLink }),
            })

            const data = await res.json()

            if (res.ok) {
                setCurrentGithubLink(githubLink)
                toast({
                    title: 'Success',
                    description: 'GitHub link updated successfully',
                })
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update GitHub link',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update GitHub link',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/participant">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">Project Submission</h1>
                        <p className="text-muted-foreground">Submit your GitHub repository link</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            GitHub Repository
                        </CardTitle>
                        <CardDescription>
                            {SUBMISSION_LOCKED 
                                ? 'Submissions are currently locked. Please wait for further instructions.'
                                : 'Enter your GitHub repository link for your project submission'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {SUBMISSION_LOCKED ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border-2 border-dashed">
                                    <div className="text-center space-y-4">
                                        <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
                                        <div>
                                            <p className="text-lg font-semibold">Submissions Locked</p>
                                            <p className="text-sm text-muted-foreground">
                                                Submissions are not yet open. Please check back later.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {currentGithubLink && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="font-medium">Current Submission</span>
                                        </div>
                                        <a
                                            href={currentGithubLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-500 hover:underline break-all"
                                        >
                                            {currentGithubLink}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="githubLink">GitHub Repository URL</Label>
                                    <Input
                                        id="githubLink"
                                        type="url"
                                        placeholder="https://github.com/username/repository"
                                        value={githubLink}
                                        onChange={(e) => setGithubLink(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the full URL to your GitHub repository
                                    </p>
                                </div>

                                {currentGithubLink && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-medium mb-1">Current Submission:</p>
                                        <a
                                            href={currentGithubLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-500 hover:underline break-all"
                                        >
                                            {currentGithubLink}
                                        </a>
                                    </div>
                                )}

                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Github className="mr-2 h-4 w-4" />
                                            {currentGithubLink ? 'Update Submission' : 'Submit Repository'}
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

