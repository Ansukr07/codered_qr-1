'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, MessageSquare, CheckCircle2 } from 'lucide-react'

const helpRequests = [
  { 
    id: "H001", 
    participant: "Alex Johnson", 
    team: "Code Ninjas",
    issue: "WiFi not working in our area",
    status: "open",
    time: "5 mins ago"
  },
  { 
    id: "H002", 
    participant: "Sarah Smith", 
    team: "Pixel Perfect",
    issue: "Need extra power outlet",
    status: "open",
    time: "12 mins ago"
  },
  { 
    id: "H003", 
    participant: "Mike Brown", 
    team: "Data Dynamos",
    issue: "Laptop charger not working",
    status: "in-progress",
    time: "25 mins ago"
  },
  { 
    id: "H004", 
    participant: "Emily Davis", 
    team: "Code Ninjas",
    issue: "Question about API access",
    status: "closed",
    time: "1 hour ago"
  },
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Help Requests</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">2 Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">1 In Progress</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {helpRequests.map((request) => (
          <Card 
            key={request.id} 
            className={`bg-card/50 backdrop-blur border-border/50 ${
              request.status === "open" ? "border-l-4 border-l-red-500" :
              request.status === "in-progress" ? "border-l-4 border-l-yellow-500" :
              "border-l-4 border-l-green-500 opacity-60"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{request.participant}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {request.team}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      request.status === "open" ? "destructive" :
                      request.status === "in-progress" ? "warning" :
                      "success"
                    }
                  >
                    {request.status === "in-progress" ? "In Progress" : request.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{request.time}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{request.issue}</p>
              </div>
              
              {request.status !== "closed" && (
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Reply to participant</span>
                  </div>
                  <Textarea 
                    placeholder="Type your response here..." 
                    className="bg-secondary/50 min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Mark In Progress
                    </Button>
                    <Button size="sm" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Send & Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
