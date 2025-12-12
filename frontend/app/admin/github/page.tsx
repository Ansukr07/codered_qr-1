'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Loader2, GitCommit, Star, GitFork } from 'lucide-react'
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
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchGithubStatus()
      }, 30000)

      return () => clearInterval(interval)
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
          if (p.githubLink) {
            uniqueRepos.add(p.githubLink)
          }
        })
        
        // Fetch stats for each unique repository
        const statsPromises = Array.from(uniqueRepos).map(async (repoUrl) => {
          try {
            const statsRes = await fetch(`/api/github/stats?url=${encodeURIComponent(repoUrl)}`)
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
        console.error('Failed to fetch GitHub status:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub status:', error)
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

  // Group participants by team
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
        {githubStatus && (
          <Badge variant="outline" className="gap-2">
            <Github className="h-4 w-4" />
            {githubStatus.stats.submitted}/{githubStatus.stats.total} Teams Connected
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : githubStatus && githubStatus.participants.length > 0 ? (
        <div className="grid gap-4">
          {Array.from(teamMap.entries()).map(([teamId, participants]) => {
            // Deduplicate participants by email within the team
            const uniqueParticipants = Array.from(
              new Map(participants.map(p => [p.email?.toLowerCase() || p._id, p])).values()
            )
            
            const hasGithubLink = uniqueParticipants.some(p => p.githubLink)
            const teamStatus = hasGithubLink ? 'submitted' : 'pending'
            const githubLink = uniqueParticipants.find(p => p.githubLink)?.githubLink || null
            const stats = githubLink ? repoStats.get(githubLink) : null

            return (
              <Card
                key={teamId}
                className={`bg-card/50 backdrop-blur border-border/50 ${teamStatus === "pending" ? "opacity-60" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {teamId}
                        {teamStatus === "submitted" && (
                          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {uniqueParticipants.length} member{uniqueParticipants.length !== 1 ? 's' : ''}
                      </CardDescription>
                      {githubLink && (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Github className="h-4 w-4" />
                            <span className="font-mono text-xs break-all">{githubLink}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 gap-1"
                              onClick={() => window.open(githubLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                          {stats && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                              <div className="flex items-center gap-1">
                                <GitCommit className="h-3 w-3" />
                                <span>{stats.commits || 0} commits</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                <span>{stats.stars || 0} stars</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GitFork className="h-3 w-3" />
                                <span>{stats.forks || 0} forks</span>
                              </div>
                              {stats.language && (
                                <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded">
                                  {stats.language}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant={teamStatus === "submitted" ? "default" : "secondary"}>
                      {teamStatus === "submitted" ? "Submitted" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamStatus === "submitted" && githubLink ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Team Members:</p>
                      <div className="space-y-1">
                        {uniqueParticipants.map((participant) => (
                          <div key={participant._id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              <p className="text-xs text-muted-foreground">{participant.email}</p>
                            </div>
                            {participant.githubLink && (
                              <Badge variant="outline" className="text-xs">
                                Linked
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-dashed border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Github className="h-4 w-4" />
                        <span>No repository linked yet</span>
                      </div>
                    </div>
                  )}
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
