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
  track?: string
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

  const [tab, setTab] = useState<'main' | 'unisys'>('main')

  const filteredParticipants = participants.filter(p => {
    // Search Filter
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.teamId && p.teamId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.qrCode && p.qrCode.toLowerCase().includes(searchTerm.toLowerCase()))

    // Track Filter - Check track field OR qrCode content
    const isUnisys = (p.track === 'CRU') || (p.qrCode && p.qrCode.toUpperCase().includes('CRU'));

    const matchesTrack = tab === 'main'
      ? !isUnisys
      : isUnisys

    return matchesSearch && matchesTrack
  })

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

  // Grouping Logic (Reused)
  const groupedParticipants = filteredParticipants.reduce((groups, participant) => {
    const team = participant.teamId || 'No Team'
    if (!groups[team]) {
      groups[team] = []
    }
    groups[team].push(participant)
    return groups
  }, {} as Record<string, Participant[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Participant Management</h1>
        <Button variant="default" className="gap-2" onClick={exportToCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setTab('main')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${tab === 'main'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Main Track (CodeRed)
        </button>
        <button
          onClick={() => setTab('unisys')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${tab === 'unisys'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Unisys Track
        </button>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {tab === 'main' ? 'Main Track' : 'Unisys Track'} Participants ({filteredParticipants.length})
            </CardTitle>
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
          <div className="space-y-8">
            {Object.entries(groupedParticipants)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([teamId, teamParticipants]) => (
                <div key={teamId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-primary">{teamId}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {teamParticipants.length} members
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground w-[200px]">Name</TableHead>
                        <TableHead className="text-foreground">Email</TableHead>
                        <TableHead className="text-foreground">QR Code</TableHead>
                        <TableHead className="text-foreground text-center">Resources</TableHead>
                        <TableHead className="text-foreground text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamParticipants.map((participant) => (
                        <TableRow
                          key={participant._id}
                          className="cursor-pointer hover:bg-secondary/50 transition-colors"
                          onClick={() => window.location.href = `/admin/participants/detail?id=${participant._id}`}
                        >
                          <TableCell className="font-medium text-card-foreground">
                            {participant.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{participant.email || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-xs">{participant.qrCode}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={participant.resourcesClaimed > 0 ? "default" : "secondary"}>
                              {participant.resourcesClaimed}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground text-right">
                            {new Date(participant.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

            {filteredParticipants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No participants found in {tab === 'main' ? 'Main' : 'Unisys'} track
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
