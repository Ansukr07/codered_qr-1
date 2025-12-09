'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sword, Upload, Loader2, CheckCircle2, XCircle, Trophy, Target, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
                toast.success('Evidence Transmitted. Awaiting Command Approval.')
                setSelectedTask(null)
                setFile(null)
                fetchTasks()
                // Force a second update to be sure
                setTimeout(fetchTasks, 1000)
            } else {
                const data = await res.json()
                toast.error(data.message || 'Transmission failed')
            }
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to transmit evidence')
        } finally {
            setUploading(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400 relative z-10" />
            </div>
            <p className="text-cyan-300/60 font-mono text-sm tracking-widest animate-pulse">INITIALIZING QUEST MATRIX...</p>
        </div>
    )

    return (
        <div className="space-y-8">
            {/* Quest Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {tasks.map((task) => (
                    <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group relative"
                    >
                        {/* Glow Effect */}
                        <div className={`absolute -inset-0.5 rounded-xl opacity-30 group-hover:opacity-100 transition-opacity blur-lg
                            ${task.status === 'approved' ? 'bg-green-500/50' :
                                task.status === 'rejected' ? 'bg-red-500/50' :
                                    task.status === 'pending' ? 'bg-yellow-500/50' :
                                        'bg-cyan-500/50'}`}
                        />

                        {/* Card Content */}
                        <div className="relative h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col">
                            {/* Header Strip */}
                            <div className={`h-1 w-full 
                                ${task.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                    task.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                                        task.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                                            'bg-gradient-to-r from-cyan-500 to-blue-500'}
                            `} />

                            <div className="p-6 flex-1 flex flex-col relative">
                                {/* XP Badge */}
                                <div className="absolute top-4 right-4 flex flex-col items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-lg skew-x-[-10deg] shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                    <span className="text-xl font-black text-white italic skew-x-[10deg] leading-none">+{task.points}</span>
                                    <span className="text-[9px] font-bold text-cyan-400 skew-x-[10deg] tracking-widest">XP</span>
                                </div>

                                <div className="mb-4 space-y-3 pr-16">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                            ${task.category === 'technical' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                'border-sky-500/30 text-sky-400 bg-sky-500/10'}
                                        `}>
                                            {task.category}
                                        </div>
                                        {task.status === 'approved' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                                                <CheckCircle2 className="w-3 h-3" /> Complete
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                                        {task.title}
                                    </h3>
                                </div>

                                <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">
                                    {task.description}
                                </p>

                                {/* Action Area */}
                                <div className="mt-auto">
                                    {!task.status || task.status === 'open' || task.status === 'rejected' ? (
                                        <Button
                                            className={`w-full relative overflow-hidden group/btn border-0
                                                ${task.status === 'rejected' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                                            `}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                            <div className="relative flex items-center justify-center gap-2 font-bold tracking-wide uppercase">
                                                <Sword className="w-4 h-4" />
                                                {task.status === 'rejected' ? 'Retry Mission' : 'Accept Mission'}
                                            </div>
                                        </Button>
                                    ) : task.status === 'pending' ? (
                                        <div className="w-full py-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center gap-2 text-yellow-500 font-bold uppercase tracking-wide text-xs animate-pulse">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying Intel...
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2 text-green-500 font-bold uppercase tracking-wide text-xs">
                                            <Shield className="w-4 h-4" />
                                            Already Claimed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Upload Modal - Premium Style */}
            <Dialog open={!!selectedTask} onOpenChange={() => !uploading && setSelectedTask(null)}>
                <DialogContent className="bg-[#0a0a0c] border border-white/10 text-white sm:max-w-[500px] p-0 overflow-hidden shadow-2xl shadow-cyan-500/20 gap-0">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

                    <DialogHeader className="p-6 pb-2 relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                            <Target className="h-6 w-6 text-cyan-500" />
                            Submit Evidence
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Upload proof of completion for <span className="text-cyan-400 font-bold">"{selectedTask?.title}"</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 relative z-10">
                        <div className="relative group cursor-pointer transition-all duration-300">
                            <div className="border-2 border-dashed border-white/10 group-hover:border-cyan-500/50 rounded-lg p-12 bg-white/5 group-hover:bg-cyan-500/5 flex flex-col items-center justify-center text-center">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={handleFileChange}
                                />

                                {file ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                            <CheckCircle2 className="h-8 w-8 text-green-400" />
                                        </div>
                                        <p className="font-bold text-white mb-1">{file.name}</p>
                                        <p className="text-sm text-green-400">Ready for transmission</p>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center mb-4 transition-colors">
                                            <Upload className="h-8 w-8 text-white/40 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                        <p className="font-bold text-white mb-2">Drop Proof Here</p>
                                        <p className="text-sm text-slate-500">Supports JPG, PNG</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-white/5 border-t border-white/5 relative z-10">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedTask(null)}
                            disabled={uploading}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            ABORT
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide min-w-[140px]"
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'TRANSMIT DATA'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
