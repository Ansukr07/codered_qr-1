'use client'

import { useState, useEffect } from "react"
import Link from 'next/link'
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
import { Search, Filter, Download, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Participant {
  _id: string
  name: string
  email: string
  teamId?: string
  qrCode: string
  resourcesClaimed: number
  createdAt: string
}

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/admin/participants')
      if (res.ok) {
        const data = await res.json()
        setParticipants(data.participants)
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.teamId && p.teamId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Team ID', 'QR Code', 'Resources Claimed', 'Created At']
    const csvData = filteredParticipants.map(p => [
      p.name,
      p.email,
      p.teamId || 'N/A',
      p.qrCode,
      p.resourcesClaimed,
      new Date(p.createdAt).toLocaleDateString()
    ])

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white">
        <p>Loading participants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Participant Management</h1>
        <Button variant="default" className="gap-2" onClick={exportToCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Participants ({filteredParticipants.length})</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Name</TableHead>
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Team ID</TableHead>
                <TableHead className="text-foreground">QR Code</TableHead>
                <TableHead className="text-foreground">Resources Claimed</TableHead>
                <TableHead className="text-foreground">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow
                  key={participant._id}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => window.location.href = `/admin/participants/detail?id=${participant._id}`}
                >
                  <TableCell className="font-medium text-card-foreground">
                    {participant.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{participant.email}</TableCell>
                  <TableCell>
                    {participant.teamId ? (
                      <Badge variant="outline">{participant.teamId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs">{participant.qrCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={participant.resourcesClaimed > 0 ? "default" : "secondary"}>
                      {participant.resourcesClaimed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(participant.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredParticipants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No participants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
