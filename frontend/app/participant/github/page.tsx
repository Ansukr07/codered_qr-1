'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Github, ArrowLeft, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function ParticipantGitHubPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [githubLink, setGithubLink] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentGithubLink, setCurrentGithubLink] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(true)
    const [showConfirmation, setShowConfirmation] = useState(false)

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
            setIsFetching(true)
            const res = await fetch('/api/participant/github')
            if (res.ok) {
                const data = await res.json()
                setCurrentGithubLink(data.githubLink)
                setGithubLink(data.githubLink || '')
            }
        } catch (error) {
            console.error('Failed to fetch GitHub link:', error)
            toast.error('Failed to fetch GitHub link')
        } finally {
            setIsFetching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!githubLink.trim()) {
            toast.error('Please enter a GitHub repository URL')
            return
        }

        // Validate GitHub URL format
        const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/
        if (!githubUrlPattern.test(githubLink.trim())) {
            toast.error('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/participant/github', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubLink: githubLink.trim() }),
            })

            const data = await res.json()

            if (res.ok) {
                setCurrentGithubLink(githubLink.trim())
                setShowConfirmation(true)
                // Trigger event to update navbar
                window.dispatchEvent(new CustomEvent('githubLinkUpdated'))
            } else {
                toast.error(data.message || 'Failed to update GitHub link')
            }
        } catch (error) {
            toast.error('Failed to update GitHub link')
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
                        <h1 className="text-3xl font-bold text-foreground">GitHub Repository</h1>
                        <p className="text-muted-foreground">Submit your GitHub repository link</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            GitHub Repository Link
                        </CardTitle>
                        <CardDescription>
                            Enter your GitHub repository URL. This will be visible to administrators.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isFetching ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                                        Enter the full URL to your GitHub repository (e.g., https://github.com/username/repository)
                                    </p>
                                </div>

                                {currentGithubLink && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="font-medium text-sm">Current Submission</span>
                                        </div>
                                        <a
                                            href={currentGithubLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-500 hover:underline break-all flex items-center gap-1"
                                        >
                                            {currentGithubLink}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            You can update this link at any time
                                        </p>
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
                                            {currentGithubLink ? 'Update Repository Link' : 'Submit Repository Link'}
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {currentGithubLink && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="gap-2">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Repository Linked
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                    Your repository is visible to administrators
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Repository Submitted Successfully!
                        </DialogTitle>
                        <DialogDescription>
                            Your GitHub repository link has been submitted and is now visible to administrators.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {currentGithubLink && (
                            <div className="p-3 bg-secondary rounded-lg">
                                <p className="text-sm font-medium mb-1">Repository Link:</p>
                                <a
                                    href={currentGithubLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline break-all flex items-center gap-1"
                                >
                                    {currentGithubLink}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            setShowConfirmation(false)
                            router.push('/participant')
                        }}>
                            Return to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

