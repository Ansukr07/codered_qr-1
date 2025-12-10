'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, XCircle, ChevronLeft, Eye, Loader2, RefreshCw, Trophy, Zap, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Submission {
    _id: string
    userId: { name: string, teamId: string }
    taskId: { title: string, points: number }
    proofUrl: string
    status: string
    createdAt: string
}

export default function VerifyTasksPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [fetching, setFetching] = useState(true)
    const [currentTab, setCurrentTab] = useState('pending')
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

    const fetchSubmissions = async (status = currentTab, silent = false) => {
        if (!silent) setFetching(true)
        try {
            const timestamp = new Date().getTime()
            console.log(`[Polling] Fetching submissions with status: ${status}, silent: ${silent}`)
            const res = await fetch(`/api/gamification/submissions?status=${status}&t=${timestamp}`, {
                cache: 'no-store',
                credentials: 'include' // Ensure cookies are sent
            })
            if (res.ok) {
                const data = await res.json()
                console.log(`[Polling] Received ${data.submissions.length} submissions`)
                setSubmissions(data.submissions)
                if (!silent) {
                    toast.success('Refreshed successfully!')
                }
            } else {
                console.error(`[Polling] Failed with status: ${res.status}`)
                if (!silent) {
                    toast.error('Failed to fetch submissions')
                }
            }
        } catch (error) {
            console.error('[Polling] Network error:', error)
            if (!silent) {
                toast.error('Network error while fetching submissions')
            }
        } finally {
            setFetching(false) // Always reset, regardless of silent flag
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (user && (user.role === 'volunteer' || user.role === 'admin')) {
            console.log('[Polling] Setting up polling for status:', currentTab)
            fetchSubmissions()
            interval = setInterval(() => {
                console.log('[Polling] Interval tick - fetching submissions')
                fetchSubmissions(currentTab, true)
            }, 5000)
        }

        return () => {
            if (interval) {
                console.log('[Polling] Cleaning up interval')
                clearInterval(interval)
            }
        }
    }, [user, currentTab])
    const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
        setProcessing(id)
        try {
            const res = await fetch(`/api/gamification/submissions/${id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                if (status === 'approved') {
                    toast.success("Nice! Task Approved! 🎉")
                } else {
                    toast.info("Task Rejected")
                }

                // Remove from list after a small delay for animation
                setTimeout(() => {
                    setSubmissions(prev => prev.filter(s => s._id !== id))
                    if (selectedSubmission?._id === id) setSelectedSubmission(null)
                    setProcessing(null)
                }, 500)

            } else {
                const data = await res.json()
                toast.error(data.message || 'Verification failed')
                setProcessing(null)
            }
        } catch (error) {
            console.error('Verification error:', error)
            toast.error('Failed to verify submission')
            setProcessing(null)
        }
    }

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 pointer-events-none" />
            <div className="fixed inset-0 opacity-[0.08] pointer-events-none" style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }} />

            <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                {/* Header with Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/volunteer">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                Verify Tasks <Trophy className="text-yellow-500 h-6 w-6" />
                            </h1>
                            <p className="text-zinc-400">Keep the streak alive!</p>
                        </div>
                    </div>

                    <div className="flex gap-4">

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchSubmissions(currentTab)}
                            disabled={fetching}
                            className="h-auto aspect-square bg-zinc-900/50 border-white/10 text-white hover:bg-white/10 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col space-y-6">
                    <Tabs value={currentTab} className="w-full" onValueChange={(val) => {
                        setCurrentTab(val)
                        fetchSubmissions(val)
                    }}>
                        <div className="flex justify-between items-center bg-zinc-900/50 p-1 rounded-lg border border-white/10 w-fit">
                            <TabsList className="bg-transparent border-none">
                                <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-500">
                                    Pending Review
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
                                    Approved History
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="pending" className="mt-6">
                            {/* Submissions Grid with Animation */}
                            {submissions.length === 0 && !fetching ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-24 text-center space-y-4"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                                        <CheckCircle className="h-24 w-24 text-green-500 relative z-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">All Clear!</h3>
                                    <p className="text-zinc-400 max-w-sm">
                                        You've verified all pending tasks. Great job! Take a break or check back later.
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {submissions.map((submission, index) => (
                                            <motion.div
                                                key={submission._id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                            >
                                                <Card className="bg-zinc-900/60 backdrop-blur border-white/10 hover:border-white/20 transition-colors overflow-hidden group h-full flex flex-col">
                                                    <CardHeader className="pb-3 bg-white/5">
                                                        <div className="flex justify-between items-start">
                                                            <Badge variant="outline" className="bg-black/50 border-white/10 text-zinc-300 font-mono">{submission.userId.teamId}</Badge>
                                                            <span className="text-xs text-zinc-400 font-mono">{new Date(submission.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="mt-2">
                                                            <CardTitle className="text-lg text-white line-clamp-1">{submission.taskId.title}</CardTitle>
                                                            <CardDescription className="line-clamp-1 text-zinc-400">
                                                                by <span className="text-white font-medium">{submission.userId.name}</span>
                                                            </CardDescription>
                                                        </div>
                                                        <Badge className="w-fit mt-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
                                                            +{submission.taskId.points} Points
                                                        </Badge>
                                                    </CardHeader>

                                                    <div
                                                        className="relative aspect-video bg-black/50 cursor-pointer overflow-hidden"
                                                        onClick={() => setSelectedSubmission(submission)}
                                                    >
                                                        <img
                                                            src={submission.proofUrl}
                                                            alt="Proof"
                                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button variant="secondary" size="sm" className="gap-2">
                                                                <Eye className="h-4 w-4" /> View Fullscreen
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <CardContent className="p-4 pt-4 mt-auto">
                                                        <div className="flex gap-3">
                                                            <Button
                                                                variant="ghost"
                                                                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleVerify(submission._id, 'rejected')}
                                                                disabled={processing === submission._id}
                                                            >
                                                                {processing === submission._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                                                                onClick={() => handleVerify(submission._id, 'approved')}
                                                                disabled={processing === submission._id}
                                                            >
                                                                {processing === submission._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="approved" className="mt-6">
                            {/* Approved Grid */}
                            {submissions.length === 0 && !fetching ? (
                                <div className="text-center py-12 text-zinc-500">No approved tasks yet.</div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {submissions.map((submission) => (
                                        <Card key={submission._id} className="bg-zinc-900/40 border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className="text-zinc-500 border-white/10">{submission.userId.teamId}</Badge>
                                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>
                                                </div>
                                                <CardTitle className="text-base text-zinc-300 mt-2">{submission.taskId.title}</CardTitle>
                                                <CardDescription className="text-zinc-500">
                                                    by {submission.userId.name}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div >
            </div >

            {/* View Proof Modal */}
            < Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-black/95 border-none">
                    <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
                        <DialogTitle className="text-white flex items-center gap-2">
                            {selectedSubmission?.taskId.title}
                            <Badge variant="outline" className="text-white border-white/20">
                                {selectedSubmission?.userId.name}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 flex items-center justify-center h-[80vh] relative">
                        {selectedSubmission && (
                            <img
                                src={selectedSubmission.proofUrl}
                                alt="Proof Fullscreen"
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-background/10 backdrop-blur absolute bottom-0 left-0 right-0 z-20 flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => selectedSubmission && handleVerify(selectedSubmission._id, 'rejected')}
                            disabled={processing === selectedSubmission?._id}
                            className="flex-1"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={() => selectedSubmission && handleVerify(selectedSubmission._id, 'approved')}
                            disabled={processing === selectedSubmission?._id}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}
