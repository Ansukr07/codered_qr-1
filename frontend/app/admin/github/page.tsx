'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Loader2, GitCommit, Star, GitFork, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

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

export default function GitHubPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [repoStats, setRepoStats] = useState<Map<string, GitHubStats>>(new Map())

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
        console.log('GitHub status fetched:', data.stats, 'participants:', data.participants.length)
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
                            <div className="flex flex-col items-center gap-2">
                              <GitCommit className="h-6 w-6 text-muted-foreground" />
                              <span className="text-4xl font-bold text-foreground">{stats.commits || 0}</span>
                              <span className="text-sm text-muted-foreground">Commits</span>
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
    </div>
  )
}
