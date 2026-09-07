'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { useToast } from '@/hooks/use-toast'
import { startCameraWithFallback, requestCameraPermission, isCameraAvailable } from '@/lib/camera-utils'

interface Resource {
    _id: string
    name: string
    category: string
    totalQuantity: number
    distributedQuantity: number
}

export default function DynamicScanPage() {
    const params = useParams()
    const resourceId = params.resourceId as string
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState<{ success: boolean; name: string; message?: string } | null>(null)
    const [resource, setResource] = useState<Resource | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (resourceId) {
            fetchResource()
        }
    }, [resourceId])

    const fetchResource = async () => {
        try {
            const res = await fetch('/api/resources')
            const data = await res.json()
            const foundResource = data.resources.find((r: any) => r._id === resourceId)
            setResource(foundResource)
        } catch (error) {
            console.error('Failed to fetch resource:', error)
        }
    }

    useEffect(() => {
        if (scanning) {
            let html5Qrcode: any = null

            const startScanning = async () => {
                try {
                    html5Qrcode = new Html5Qrcode('qr-reader-dynamic')

                    await startCameraWithFallback(html5Qrcode, {
                        elementId: 'qr-reader-dynamic',
                        onScanSuccess: (decodedText: string) => {
                            onScanSuccess(decodedText)
                        },
                        onScanError: (errorMessage: string) => {
                            onScanError(errorMessage)
                        },
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    })

                    console.log('✅ Scanner started successfully')
                } catch (error: any) {
                    console.error('Scanner start error:', error)
                    toast({
                        title: 'Camera Error',
                        description: error.message || 'Unable to access camera. Please check permissions and try again.',
                        variant: 'destructive',
                    })
                    setScanning(false)
                }
            }

            startScanning()

            return () => {
                if (html5Qrcode && html5Qrcode.isScanning) {
                    Promise.resolve().then(() => html5Qrcode.stop()).catch((err: any) => {
                        console.error('Error stopping scanner:', err)
                    })
                }
            }
        }
    }, [scanning])

    const onScanSuccess = async (decodedText: string) => {
        if (!resource) {
            toast({
                title: 'Error',
                description: 'Resource not available',
                variant: 'destructive',
            })
            return
        }

        setScanning(false)

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_code: decodedText,
                    resource_id: resource._id,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                setResult({
                    success: true,
                    name: data.memberName || "Participant",
                    message: data.message
                })
                toast({
                    title: 'Success',
                    description: `${resource.name} distributed successfully`,
                })
                fetchResource() // Refresh counts
            } else {
                setResult({
                    success: false,
                    name: "Error",
                    message: data.message
                })
                toast({
                    title: 'Error',
                    description: data.message,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            setResult({
                success: false,
                name: "Error",
                message: 'Failed to process scan'
            })
            toast({
                title: 'Error',
                description: 'Failed to process scan',
                variant: 'destructive',
            })
        }
    }

    const onScanError = (error: any) => {
        // Ignore continuous scan errors
    }

    const handleStartScan = () => {
        setScanning(true)
        setResult(null)
    }

    // Get color based on category
    const getCategoryColor = () => {
        if (!resource) return { text: 'text-gray-500', bg: 'bg-gray-500' }

        const colors: { [key: string]: { text: string; bg: string } } = {
            food: { text: 'text-orange-500', bg: 'bg-orange-500' },
            accommodation: { text: 'text-blue-500', bg: 'bg-blue-500' },
            chill_room: { text: 'text-purple-500', bg: 'bg-purple-500' },
            other: { text: 'text-teal-500', bg: 'bg-teal-500' }
        }

        return colors[resource.category] || colors.other
    }

    const colors = getCategoryColor()

    if (!resource) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/volunteer">
                        <Button variant="default" size="icon">
                            <ArrowLeft className="h-4 w-4 text-white" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Loading...</h1>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/volunteer">
                    <Button variant="default" size="icon">
                        <ArrowLeft className="h-4 w-4 text-white" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Scan for {resource.name}</h1>
                    <p className="text-muted-foreground">Distribute {resource.name} to participants</p>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className={`h-5 w-5 ${colors.text}`} />
                        QR Code Scanner
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-secondary/50 border-2 border-dashed border-border">
                        {!scanning && !result && (
                            <div className="aspect-square flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                    <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">Ready to scan QR code</p>
                                </div>
                            </div>
                        )}
                        {scanning && (
                            <div id="qr-reader-dynamic" className="w-full"></div>
                        )}
                        {result && (
                            <div className="aspect-square flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                    {result.success ? (
                                        <>
                                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-card-foreground">{result.name}</p>
                                                <Badge variant="default" className={`text-sm ${colors.bg}`}>
                                                    {resource.name} distributed
                                                </Badge>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-16 w-16 text-destructive mx-auto" />
                                            <p className="text-lg font-semibold text-destructive">Scan Failed</p>
                                            <p className="text-sm text-muted-foreground">{result.message}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {!result ? (
                            <Button
                                onClick={handleStartScan}
                                disabled={scanning || !resource}
                                className="flex-1"
                                size="lg"
                            >
                                {scanning ? "Scanning..." : "Start Scan"}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => setResult(null)}
                                    variant="outline"
                                    className="flex-1"
                                    size="lg"
                                >
                                    Scan Another
                                </Button>
                                <Link href="/volunteer" className="flex-1">
                                    <Button variant="default" className="w-full" size="lg">
                                        Done
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {resource && (
                <Card className={`bg-gradient-to-br from-${colors.text}/10 to-primary/10 border-${colors.text}/20`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Remaining</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {resource.totalQuantity - resource.distributedQuantity}/{resource.totalQuantity}
                                </p>
                            </div>
                            <Package className={`h-12 w-12 ${colors.text} opacity-50`} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
