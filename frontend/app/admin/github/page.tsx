'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Loader2, GitCommit, Star, GitFork, RefreshCw, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GitHubParticipant {
  _id: string
  name: string
  email: string
  teamId?: string
  githubLink: string | null
  status: 'submitted' | 'pending'
  createdAt: string
}

interface GitHubStats {
  stars: number
  forks: number
  commits: number
  openIssues: number
  language: string | null
  description: string | null
  updatedAt: string | null
}

interface GitHubStatus {
  participants: GitHubParticipant[]
  stats: {
    total: number
    submitted: number
    pending: number
  }
}

interface Commit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

export default function GitHubPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [repoStats, setRepoStats] = useState<Map<string, GitHubStats>>(new Map())

  // Commits Modal State
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [isCommitsLoading, setIsCommitsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin-login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchGithubStatus()
      // Only fetch once on mount, no auto-refresh
    }
  }, [user])

  const fetchGithubStatus = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/participants/github-status', {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setGithubStatus(data)

        // Fetch stats for all repositories
        const statsMap = new Map<string, GitHubStats>()
        const uniqueRepos = new Set<string>()

        data.participants.forEach((p: GitHubParticipant) => {
          if (p.githubLink && p.githubLink.trim()) {
            uniqueRepos.add(p.githubLink.trim())
          }
        })

        // Fetch stats for each unique repository
        const statsPromises = Array.from(uniqueRepos).map(async (repoUrl) => {
          try {
            const statsRes = await fetch(`/api/github/stats?url=${encodeURIComponent(repoUrl)}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache'
              }
            })
            if (statsRes.ok) {
              const stats = await statsRes.json()
              statsMap.set(repoUrl, stats)
            }
          } catch (error) {
            console.error(`Error fetching stats for ${repoUrl}:`, error)
          }
        })

        await Promise.all(statsPromises)
        setRepoStats(statsMap)
      } else {
        const errorText = await res.text()
        console.error('Failed to fetch GitHub status:', res.status, res.statusText, errorText)
        toast.error('Failed to fetch GitHub status')
      }
    } catch (error) {
      console.error('Failed to fetch GitHub status:', error)
      toast.error('Failed to fetch GitHub status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewCommits = async (repoUrl: string) => {
    setSelectedRepo(repoUrl)
    setIsModalOpen(true)
    setIsCommitsLoading(true)
    setCommits([])

    try {
      const res = await fetch(`/api/github/commits?url=${encodeURIComponent(repoUrl)}`)
      if (res.ok) {
        const data = await res.json()
        setCommits(data.commits)
      } else {
        toast.error('Failed to fetch commits')
      }
    } catch (error) {
      console.error('Error fetching commits:', error)
      toast.error('Failed to fetch commits')
    } finally {
      setIsCommitsLoading(false)
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Group participants by team - Supabase data should be clean
  const teamMap = new Map<string, GitHubParticipant[]>()
  if (githubStatus) {
    githubStatus.participants.forEach(participant => {
      const teamId = participant.teamId || 'Individual'

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, [])
      }
      teamMap.get(teamId)!.push(participant)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">GitHub Project Status</h1>
          <p className="text-muted-foreground">View all participant GitHub repository submissions</p>
        </div>
        <div className="flex items-center gap-2">
          {githubStatus && (
            <Badge variant="outline" className="gap-2">
              <Github className="h-4 w-4" />
              {githubStatus.stats.submitted}/{githubStatus.stats.total} Teams Connected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGithubStatus}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : githubStatus && githubStatus.participants.length > 0 ? (
        <div className="grid gap-4">
          {Array.from(teamMap.entries()).map(([teamId, participants]) => {
            // Supabase data should be clean, but just in case, remove duplicates by email
            const uniqueParticipants = participants.filter((participant, index, arr) => {
              // Keep first occurrence of each email
              return arr.findIndex(p => p.email === participant.email) === index
            })

            const hasGithubLink = uniqueParticipants.some(p => p.githubLink)
            const teamStatus = hasGithubLink ? 'submitted' : 'pending'
            const githubLink = uniqueParticipants.find(p => p.githubLink)?.githubLink || null
            const stats = githubLink ? repoStats.get(githubLink) : null

            return (
              <Card
                key={teamId}
                className={`bg-card/50 backdrop-blur border-border/50 ${teamStatus === "pending" ? "opacity-60" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Team Name */}
                    <div className="text-center">
                      <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        {teamId}
                        {teamStatus === "submitted" && (
                          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </CardTitle>
                    </div>

                    {/* Repository Link */}
                    {githubLink ? (
                      <div className="w-full space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <Github className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-blue-500 hover:underline break-all text-center"
                          >
                            {githubLink}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => window.open(githubLink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Stats - Large and Centered */}
                        {stats ? (
                          <div className="flex items-center justify-center gap-8 pt-4">
                            <div
                              className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-muted/50"
                              onClick={() => handleViewCommits(githubLink)}
                            >
                              <GitCommit className="h-6 w-6 text-muted-foreground" />
                              <span className="text-4xl font-bold text-foreground">{stats.commits || 0}</span>
                              <span className="text-sm text-muted-foreground group-hover:underline">Commits</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <Star className="h-6 w-6 text-muted-foreground" />
                              <span className="text-4xl font-bold text-foreground">{stats.stars || 0}</span>
                              <span className="text-sm text-muted-foreground">Stars</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <GitFork className="h-6 w-6 text-muted-foreground" />
                              <span className="text-4xl font-bold text-foreground">{stats.forks || 0}</span>
                              <span className="text-sm text-muted-foreground">Forks</span>
                            </div>
                            {stats.language && (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-primary/10 rounded text-muted-foreground">
                                  Language
                                </span>
                                <span className="text-2xl font-semibold text-foreground">{stats.language}</span>
                              </div>
                            )}
                          </div>
                        ) : githubLink && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                        <Github className="h-5 w-5" />
                        <span>No repository linked yet</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No participants found</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commits Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Recent Commits
            </DialogTitle>
            <DialogDescription className="break-all">
              Viewing commits for {selectedRepo}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {isCommitsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading commits...</p>
              </div>
            ) : commits.length > 0 ? (
              <div className="space-y-4">
                {commits.map((commit) => (
                  <div key={commit.sha} className="p-4 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-foreground">{commit.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {commit.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(commit.date).toLocaleDateString()} {new Date(commit.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => window.open(commit.url, '_blank')}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <GitCommit className="h-12 w-12 mb-2 opacity-50" />
                <p>No commits found</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
