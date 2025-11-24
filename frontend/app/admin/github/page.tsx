'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Github, GitCommit, Star, GitBranch, Clock, ExternalLink } from 'lucide-react'

const teams = [
  {
    name: "Code Ninjas",
    repo: "github.com/codeninja/hackathon-project",
    commits: 45,
    lastPush: "2 mins ago",
    stars: 3,
    status: "active"
  },
  {
    name: "Pixel Perfect",
    repo: "github.com/pixelperfect/design-tool",
    commits: 32,
    lastPush: "15 mins ago",
    stars: 5,
    status: "active"
  },
  {
    name: "Data Dynamos",
    repo: "github.com/datadynamos/ml-platform",
    commits: 28,
    lastPush: "1 hour ago",
    stars: 2,
    status: "active"
  },
  {
    name: "Bug Hunters",
    repo: "Not linked",
    commits: 0,
    lastPush: "N/A",
    stars: 0,
    status: "inactive"
  },
]

export default function GitHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">GitHub Project Status</h1>
        <Badge variant="outline" className="gap-2">
          <Github className="h-4 w-4" />
          3/4 Teams Connected
        </Badge>
      </div>

      <div className="grid gap-4">
        {teams.map((team, index) => (
          <Card
            key={index}
            className={`bg-card/50 backdrop-blur border-border/50 ${team.status === "inactive" ? "opacity-60" : ""
              }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {team.name}
                    {team.status === "active" && (
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Github className="h-4 w-4" />
                    <span className="font-mono text-xs">{team.repo}</span>
                    {team.status === "active" && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
                <Badge variant={team.status === "active" ? "success" : "secondary"}>
                  {team.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {team.status === "active" ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <GitCommit className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{team.commits}</p>
                      <p className="text-xs text-muted-foreground">Commits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{team.stars}</p>
                      <p className="text-xs text-muted-foreground">Stars</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{team.lastPush}</p>
                      <p className="text-xs text-muted-foreground">Last Push</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-dashed border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    <span>No repository linked yet</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Add Repository
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
