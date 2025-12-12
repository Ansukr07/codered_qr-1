'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Github, ArrowLeft, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

function GitHubPageContent() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentGithubLink, setCurrentGithubLink] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(true)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

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

    useEffect(() => {
        // Check for OAuth errors
        const error = searchParams.get('error')
        if (error) {
            if (error === 'oauth_not_configured') {
                toast.error('GitHub OAuth is not configured. Please contact support.')
            } else if (error === 'missing_params') {
                toast.error('OAuth callback missing required parameters')
            } else {
                toast.error(`GitHub connection failed: ${error}`)
            }
        }
    }, [searchParams])

    const fetchGithubLink = async () => {
        try {
            setIsFetching(true)
            const res = await fetch('/api/participant/github')
            if (res.ok) {
                const data = await res.json()
                setCurrentGithubLink(data.githubLink)
            }
        } catch (error) {
            console.error('Failed to fetch GitHub link:', error)
            toast.error('Failed to fetch GitHub link')
        } finally {
            setIsFetching(false)
        }
    }

    const handleConnectGitHub = async () => {
        if (!user?.userId) {
            toast.error('User not found. Please log in again.')
            return
        }

        setIsConnecting(true)
        try {
            const res = await fetch(`/api/github/oauth?userId=${user.userId}`)
            const data = await res.json()
            
            if (res.ok && data.authUrl) {
                // Redirect to GitHub OAuth
                window.location.href = data.authUrl
            } else {
                toast.error(data.message || 'Failed to connect with GitHub.')
                setIsConnecting(false)
            }
        } catch (error) {
            console.error('Error connecting to GitHub:', error)
            toast.error('Failed to connect with GitHub.')
            setIsConnecting(false)
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
                            Connect your GitHub account to select a repository. This will be visible to administrators.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isFetching ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Connect with GitHub Button */}
                                <div className="space-y-2">
                                    <Button
                                        type="button"
                                        onClick={handleConnectGitHub}
                                        disabled={isConnecting}
                                        className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Github className="mr-2 h-4 w-4" />
                                                Connect with GitHub
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Connect your GitHub account to easily select a repository
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
                                            You can update this link by connecting with GitHub again
                                        </p>
                                    </div>
                                )}
                            </div>
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
            <Dialog open={showConfirmation} onOpenChange={(open) => {
                setShowConfirmation(open)
                if (!open) {
                    router.push('/participant')
                }
            }}>
                <DialogContent className="sm:max-w-[500px] z-[9999]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            Repository Submitted Successfully!
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Your GitHub repository link has been submitted and is now visible to administrators.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {currentGithubLink ? (
                            <div className="p-4 bg-secondary rounded-lg border border-green-500/20">
                                <p className="text-sm font-semibold mb-2 text-foreground">Repository Link:</p>
                                <div className="break-all">
                                    <a
                                        href={currentGithubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-500 hover:underline flex items-center gap-1 font-mono"
                                    >
                                        <span className="break-all">{currentGithubLink}</span>
                                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-secondary rounded-lg">
                                <p className="text-sm text-muted-foreground">No repository link available</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={() => {
                                setShowConfirmation(false)
                                router.push('/participant')
                            }}
                            className="w-full sm:w-auto"
                        >
                            Return to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function ParticipantGitHubPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <GitHubPageContent />
        </Suspense>
    )
}

