'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2, Clock, XCircle, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Task {
    _id: string
    title: string
    description: string
    points: number
    status: 'open' | 'pending' | 'approved' | 'rejected'
    requiresProof?: boolean
}

export default function TasksList() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/gamification/tasks')
            if (res.ok) {
                const data = await res.json()
                console.log('Fetched tasks:', data.tasks)
                setTasks(data.tasks)
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
        // Poll for status updates
        const interval = setInterval(fetchTasks, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!selectedTask) return
        if (selectedTask.requiresProof !== false && !file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('taskId', selectedTask._id)
        if (file) {
            formData.append('proof', file)
        }

        try {
            const res = await fetch('/api/gamification/submit', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                toast.success('Proof submitted successfully!')
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

    const getStatusBadge = (status: Task['status']) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Done</Badge>
            case 'pending': return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Reviewing</Badge>
            case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
            default: return <Badge variant="outline">Todo</Badge>
        }
    }

    if (loading) return <div className="text-center p-8">Loading tasks...</div>

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">Your Tasks</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {tasks.map(task => (
                    <Card key={task._id} className={`bg-card/50 backdrop-blur border-border/50 ${task.status === 'approved' ? 'opacity-75' : ''}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg text-foreground">{task.title}</CardTitle>
                                {getStatusBadge(task.status)}
                            </div>
                            <CardDescription>{task.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            {task.status === 'open' || task.status === 'rejected' ? (
                                <Button
                                    className="w-full gap-2"
                                    onClick={() => setSelectedTask(task)}
                                    variant="outline"
                                >
                                    <Upload className="w-4 h-4" />
                                    {task.status === 'rejected' ? 'Try Again' : (task.requiresProof === false ? 'Claim Reward' : 'Submit Proof')}
                                </Button>
                            ) : (
                                <div className="text-xs text-muted-foreground italic w-full text-center">
                                    {task.status === 'pending' ? 'Waiting for verification...' : 'Claimed'}
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Upload Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={() => !uploading && setSelectedTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.requiresProof === false ? 'Claim Reward' : 'Submit Proof'}: {selectedTask?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedTask?.requiresProof === false
                                ? "Confirm you have completed this task to claim your points."
                                : "Upload a screenshot or photo to verify you've completed this task."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedTask?.requiresProof === false ? (
                            <div className="text-center py-8">
                                <p className="text-lg font-medium text-primary">No proof required</p>
                                <p className="text-sm text-muted-foreground mt-2">Just click submit to complete this task!</p>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/50 transition-colors relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                {file ? (
                                    <div className="text-sm font-medium text-primary">
                                        {file.name}
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                                    </>
                                )}
                            </div>
                        )}
                        {selectedTask?.status === 'rejected' && (
                            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-md">
                                <AlertCircle className="w-4 h-4" />
                                <span>Your previous submission was rejected. Please check requirements and try again.</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedTask(null)}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={(selectedTask?.requiresProof !== false && !file) || uploading}
                        >
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
