'use client'

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data
const participants = [
  { id: "P001", name: "Alex Johnson", team: "Code Ninjas", status: "Checked In", meals: 2, bag: true },
  { id: "P002", name: "Sarah Smith", team: "Pixel Perfect", status: "Checked In", meals: 2, bag: false },
  { id: "P003", name: "Mike Brown", team: "Data Dynamos", status: "Pending", meals: 0, bag: false },
  { id: "P004", name: "Emily Davis", team: "Code Ninjas", status: "Checked In", meals: 1, bag: true },
  { id: "P005", name: "Chris Wilson", team: "Bug Hunters", status: "Checked In", meals: 2, bag: true },
]

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Participant Management</h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Participants</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search participants..." 
                  className="pl-8 bg-secondary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Sleeping Bag</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-mono text-xs">{participant.id}</TableCell>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.team}</TableCell>
                  <TableCell>
                    <Badge variant={participant.status === "Checked In" ? "success" : "secondary"}>
                      {participant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{participant.meals}/3</TableCell>
                  <TableCell>
                    <Badge variant={participant.bag ? "default" : "outline"}>
                      {participant.bag ? "Issued" : "None"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
