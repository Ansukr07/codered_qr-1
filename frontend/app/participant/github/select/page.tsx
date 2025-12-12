'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Github, ArrowLeft, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Repository {
    id: number
    name: string
    fullName: string
    url: string
    description: string | null
    private: boolean
    updatedAt: string
    defaultBranch: string
}

export default function SelectRepositoryPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && user.role === 'participant') {
            fetchRepositories()
        }
    }, [user])

    const fetchRepositories = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/github/repositories')
            
            if (res.ok) {
                const data = await res.json()
                setRepositories(data.repositories || [])
            } else {
                const errorData = await res.json()
                toast.error(errorData.message || 'Failed to fetch repositories')
                router.push('/participant/github')
            }
        } catch (error) {
            console.error('Error fetching repositories:', error)
            toast.error('Failed to fetch repositories')
            router.push('/participant/github')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectRepository = async () => {
        if (!selectedRepo) {
            toast.error('Please select a repository')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/participant/github', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubLink: selectedRepo }),
            })

            const data = await res.json()

            if (res.ok) {
                // Clear GitHub token cookie
                document.cookie = 'github_token=; path=/; max-age=0'
                document.cookie = 'github_user_id=; path=/; max-age=0'
                
                // Trigger event to update navbar
                window.dispatchEvent(new CustomEvent('githubLinkUpdated'))
                
                toast.success('Repository linked successfully!')
                router.push('/participant/github')
            } else {
                toast.error(data.message || 'Failed to link repository')
            }
        } catch (error) {
            console.error('Error linking repository:', error)
            toast.error('Failed to link repository')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredRepos = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/participant/github">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">Select Repository</h1>
                        <p className="text-muted-foreground">Choose a repository to link to your profile</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            Your Repositories
                        </CardTitle>
                        <CardDescription>
                            Select a repository from your GitHub account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Search */}
                                <Input
                                    placeholder="Search repositories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />

                                {/* Repository List */}
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {filteredRepos.length > 0 ? (
                                        filteredRepos.map((repo) => (
                                            <div
                                                key={repo.id}
                                                onClick={() => setSelectedRepo(repo.url)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                    selectedRepo === repo.url
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Github className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-semibold">{repo.fullName}</span>
                                                            {repo.private && (
                                                                <span className="text-xs px-2 py-0.5 bg-secondary rounded">Private</span>
                                                            )}
                                                        </div>
                                                        {repo.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Updated {new Date(repo.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {selectedRepo === repo.url && (
                                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {searchQuery ? 'No repositories found matching your search' : 'No repositories found'}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSelectRepository}
                                    disabled={!selectedRepo || isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Linking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Link Selected Repository
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

