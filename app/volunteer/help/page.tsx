'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, HelpCircle, Send } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteer">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mark Help Request</h1>
          <p className="text-muted-foreground">Log participant assistance request</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-yellow-500" />
            Help Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="participant">Participant Name or ID</Label>
              <Input 
                id="participant" 
                placeholder="Enter name or scan QR code" 
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team">Team Name</Label>
              <Input 
                id="team" 
                placeholder="Enter team name" 
                className="bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issue">Issue Description</Label>
              <Textarea 
                id="issue" 
                placeholder="Describe the issue or help needed..." 
                className="bg-secondary/50 min-h-[120px]"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority Level</Label>
              <select 
                id="priority" 
                className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low - Can wait</option>
                <option value="medium">Medium - Normal priority</option>
                <option value="high">High - Urgent</option>
              </select>
            </div>

            {submitted && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help request submitted successfully!
              </div>
            )}

            <Button type="submit" className="w-full gap-2" size="lg">
              <Send className="h-4 w-4" />
              Submit Help Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
