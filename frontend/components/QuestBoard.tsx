'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sword, Upload, Loader2, CheckCircle2, XCircle, Clock, Lock, Star } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Achievements from './Achievements'

interface Task {
    _id: string
    title: string
    description: string
    points: number
    category: string
    status: 'open' | 'pending' | 'approved' | 'rejected'
}

export default function QuestBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [file, setFile] = useState<File | null>(null)

    // Stats
    const [completedCount, setCompletedCount] = useState(0)
    const [totalXP, setTotalXP] = useState(0)

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/gamification/tasks')
            if (res.ok) {
                const data = await res.json()
                setTasks(data.tasks)

                // Calculate Stats
                const approved = data.tasks.filter((t: Task) => t.status === 'approved')
                setCompletedCount(approved.length)
                setTotalXP(approved.reduce((acc: number, t: Task) => acc + t.points, 0))
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
        const interval = setInterval(fetchTasks, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!selectedTask || !file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('taskId', selectedTask._id)
        formData.append('proof', file)

        try {
            const res = await fetch('/api/gamification/submit', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                toast.success('Quest Submitted! Review pending.')
                setSelectedTask(null)
                setFile(null)
                fetchTasks()
            } else {
                const data = await res.json()
                toast.error(data.message || 'Submission failed')
            }
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to submit proof')
        } finally {
            setUploading(false)
        }
    }

    // Level Calculation: Level up every 3 tasks
    const currentLevel = Math.floor(completedCount / 3) + 1
    const progressToNext = ((completedCount % 3) / 3) * 100

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading Quests...</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Quest Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                    <motion.div
                        key={task._id}
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Card className={`
                            h-full flex flex-col border-white/10 bg-card/40 backdrop-blur-sm overflow-hidden relative group
                            ${task.status === 'approved' ? 'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}
                            ${task.status === 'rejected' ? 'border-red-500/30 bg-red-500/5' : ''}
                        `}>
                            {/* Quest Status Strip */}
                            <div className={`
                                absolute top-0 left-0 w-1 h-full
                                ${task.status === 'approved' ? 'bg-green-500' :
                                    task.status === 'pending' ? 'bg-yellow-500' :
                                        task.status === 'rejected' ? 'bg-red-500' :
                                            'bg-slate-500'}
                            `} />

                            <CardContent className="p-5 flex-1 relative">
                                <div className="absolute top-4 right-4">
                                    {task.status === 'approved' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                                    {task.status === 'pending' && <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />}
                                    {task.status === 'rejected' && <XCircle className="h-6 w-6 text-red-500" />}
                                </div>

                                <div className="space-y-1 mb-4">
                                    <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur text-[10px] uppercase tracking-widest">
                                        {task.category}
                                    </Badge>
                                    <h3 className="text-xl font-bold text-foreground">
                                        {task.title}
                                    </h3>
                                    <p className="text-2xl font-black text-indigo-400">
                                        +{task.points} <span className="text-xs font-medium text-muted-foreground align-middle">XP</span>
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {task.description}
                                </p>
                            </CardContent>

                            <CardFooter className="p-5 pt-0">
                                {!task.status || task.status === 'open' || task.status === 'rejected' ? (
                                    <Button
                                        className="w-full gap-2"
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        <Sword className="h-4 w-4" />
                                        {task.status === 'rejected' ? 'Retry Quest' : 'Start Quest'}
                                    </Button>
                                ) : (
                                    <div className={`w-full py-2 rounded-md text-center text-sm font-medium border ${task.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                        }`}>
                                        {task.status === 'approved' ? 'Already Claimed' : 'Under Review'}
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Upload Modal */}
            <Dialog open={!!selectedTask} onOpenChange={() => !uploading && setSelectedTask(null)}>
                <DialogContent className="bg-black/90 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sword className="h-5 w-5 text-indigo-500" />
                            Submit Proof
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Upload evidence to complete the quest <span className="text-indigo-400 font-medium">"{selectedTask?.title}"</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-6">
                        <div className="relative group cursor-pointer">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                {file ? (
                                    <>
                                        <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                                        <p className="text-sm font-medium text-white">{file.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">Click to replace</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-indigo-500/10 mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="h-6 w-6 text-indigo-400" />
                                        </div>
                                        <p className="text-sm font-medium text-white">Drag & drop or leave here</p>
                                        <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedTask(null)}
                            disabled={uploading}
                            className="text-slate-400 hover:text-white"
                        >
                            Retreat
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim XP'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
