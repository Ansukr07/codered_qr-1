'use client'

import { useState, useEffect } from "react"
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
import { Search, Download, BedDouble, Package, PackageCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface User {
  _id: string
  name: string
  email: string
  teamId?: string
  qrCode: string
}

interface Transaction {
  _id: string
  timestamp: string
  volunteer: string
}

interface BagTransaction {
  user: User
  claim: Transaction | null
  return: Transaction | null
}

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
  remaining: number
}

interface Stats {
  totalIssued: number
  totalReturned: number
  pendingReturns: number
}

export default function SleepingBagsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<BagTransaction[]>([])
  const [resource, setResource] = useState<Resource | null>(null)
  const [stats, setStats] = useState<Stats>({ totalIssued: 0, totalReturned: 0, pendingReturns: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSleepingBags()
    // Refresh every 10 seconds
    const interval = setInterval(fetchSleepingBags, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchSleepingBags = async () => {
    try {
      const res = await fetch('/api/admin/sleeping-bags')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
        setResource(data.resource)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch sleeping bag data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchTerm.toLowerCase()
    return (
      tx.user.name.toLowerCase().includes(searchLower) ||
      tx.user.email.toLowerCase().includes(searchLower) ||
      (tx.user.teamId && tx.user.teamId.toLowerCase().includes(searchLower)) ||
      (tx.user.qrCode && tx.user.qrCode.toLowerCase().includes(searchLower))
    )
  })

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Team ID', 'QR Code', 'Claimed Date', 'Claimed Time', 'Returned Date', 'Returned Time', 'Status', 'Issued By', 'Returned By']
    const csvData = filteredTransactions.map(tx => [
      tx.user.name,
      tx.user.email,
      tx.user.teamId || 'N/A',
      tx.user.qrCode,
      tx.claim ? new Date(tx.claim.timestamp).toLocaleDateString() : 'N/A',
      tx.claim ? new Date(tx.claim.timestamp).toLocaleTimeString() : 'N/A',
      tx.return ? new Date(tx.return.timestamp).toLocaleDateString() : 'N/A',
      tx.return ? new Date(tx.return.timestamp).toLocaleTimeString() : 'N/A',
      tx.return ? 'Returned' : (tx.claim ? 'Pending Return' : 'Not Issued'),
      tx.claim ? tx.claim.volunteer : 'N/A',
      tx.return ? tx.return.volunteer : 'N/A'
    ])

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sleeping_bags_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sleeping Bag Tracking</h1>
          <p className="text-muted-foreground mt-1">Track all sleeping bag issues and returns</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bags</CardDescription>
            <CardTitle className="text-2xl">{resource?.totalQuantity || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bags Issued</CardDescription>
            <CardTitle className="text-2xl text-indigo-500">{stats.totalIssued}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bags Returned</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats.totalReturned}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Returns</CardDescription>
            <CardTitle className="text-2xl text-orange-500">{stats.pendingReturns}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, team ID, or QR code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sleeping Bag Transactions</CardTitle>
          <CardDescription>
            Complete record of all sleeping bag issues and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sleeping bag transactions found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Team ID</TableHead>
                    <TableHead>Claimed</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Returned By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.user._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.user.name}</p>
                          <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.user.teamId || <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {tx.claim ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(tx.claim.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.claim.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not issued</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.return ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(tx.return.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.return.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : tx.claim ? (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Pending
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.return ? (
                          <Badge className="bg-green-500">
                            <PackageCheck className="h-3 w-3 mr-1" />
                            Returned
                          </Badge>
                        ) : tx.claim ? (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            <Package className="h-3 w-3 mr-1" />
                            Out
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Issued</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.claim ? (
                          <span className="text-sm">{tx.claim.volunteer}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.return ? (
                          <span className="text-sm">{tx.return.volunteer}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


