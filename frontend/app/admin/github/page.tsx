'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Loader2 } from 'lucide-react'
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
      const res = await fetch('/api/admin/participants/github-status')
      if (res.ok) {
        const data = await res.json()
        setGithubStatus(data)
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
            const hasGithubLink = participants.some(p => p.githubLink)
            const teamStatus = hasGithubLink ? 'submitted' : 'pending'
            const githubLink = participants.find(p => p.githubLink)?.githubLink || null

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
                        {participants.length} member{participants.length !== 1 ? 's' : ''}
                      </CardDescription>
                      {githubLink && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
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
                        {participants.map((participant) => (
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
