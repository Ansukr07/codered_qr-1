'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, Eye, Download, RefreshCw } from 'lucide-react'

interface Submission {
    _id: string
    userId: { name: string, teamId: string }
    taskId: { title: string, points: number }
    proofUrl: string
    status: string
    verifiedBy?: { name: string }
    createdAt: string
    verifiedAt?: string
}

export default function AdminTasksPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/gamification/submissions')
            if (res.ok) {
                const data = await res.json()
                setSubmissions(data.submissions)
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const filteredSubmissions = submissions.filter(s => {
        if (filter === 'all') return true
        return s.status === filter
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>
            case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
            case 'pending': return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const exportCSV = () => {
        const headers = ['Team', 'User', 'Task', 'Points', 'Status', 'Verified By', 'Time']
        const rows = filteredSubmissions.map(s => [
            s.userId.teamId,
            s.userId.name,
            s.taskId.title,
            s.taskId.points,
            s.status,
            s.verifiedBy?.name || '-',
            new Date(s.createdAt).toLocaleString()
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "task_submissions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Task Logs</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={fetchSubmissions} className="border border-border">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="default" size="sm" onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Submission History ({filteredSubmissions.length})</CardTitle>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team / User</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Verified By</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredSubmissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No submissions found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSubmissions.map((submission) => (
                                        <TableRow key={submission._id}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{submission.userId.teamId}</div>
                                                <div className="text-xs text-muted-foreground">{submission.userId.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{submission.taskId.title}</div>
                                                <div className="text-xs text-muted-foreground">{submission.taskId.points} pts</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                            <TableCell>
                                                {submission.verifiedBy ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{submission.verifiedBy.name}</span>
                                                        {submission.verifiedAt && <span className="text-[10px] text-muted-foreground">{new Date(submission.verifiedAt).toLocaleTimeString()}</span>}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {new Date(submission.createdAt).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
