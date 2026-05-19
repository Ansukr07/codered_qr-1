'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, BedDouble, Package, PackageCheck } from 'lucide-react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { startCameraWithFallback, requestCameraPermission, isCameraAvailable } from '@/lib/camera-utils'
import { useToast } from '@/hooks/use-toast'
import { extractIdFromQr } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
}

type Mode = 'issue' | 'return'

export default function ScanBagPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name: string; message?: string } | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const [mode, setMode] = useState<Mode>('issue')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBagResource()
  }, [])

  const fetchBagResource = async () => {
    try {
      const res = await fetch('/api/resources')
      if (!res.ok) {
        throw new Error(`Failed to fetch resources: ${res.status}`)
      }
      const data = await res.json()
      const bagResource = data.resources.find((r: any) =>
        r.name.toLowerCase().includes('bag') || r.name.toLowerCase().includes('sleep')
      )
      
      if (!bagResource) {
        console.error('Sleeping bag resource not found in database')
        toast({
          title: 'Resource Not Found',
          description: 'Sleeping bag resource does not exist. Please create it in the admin panel.',
          variant: 'destructive',
        })
      }
      
      setResource(bagResource)
    } catch (error: any) {
      console.error('Failed to fetch resources:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch resources',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (scanning) {
      setCameraError(null)
      let html5Qrcode: any = null

      const startScanning = async () => {
        try {
          // The DOM id mirrors the active tab so the scanner attaches to
          // the visible element (issue vs return). Both tabs cannot mount
          // simultaneously, but using a unique id per mode avoids any
          // chance of the scanner targeting the wrong (hidden) <div>.
          const elementId = mode === 'return' ? 'qr-reader-bag-return' : 'qr-reader-bag-issue'
          html5Qrcode = new Html5Qrcode(elementId)

          await startCameraWithFallback(html5Qrcode, {
            elementId,
            onScanSuccess: (decodedText: string) => {
              onScanSuccess(decodedText)
            },
            onScanError: (errorMessage: string) => {
              // Ignore continuous scan errors
              if (errorMessage && !errorMessage.includes('NotFoundException')) {
                console.log('Scan error:', errorMessage)
              }
            },
            fps: 10,
            qrbox: { width: 250, height: 250 }
          })

          console.log('✅ Scanner started successfully')
        } catch (error: any) {
          console.error('Scanner start error:', error)
          setCameraError(error.message || 'Failed to start camera')
          setScanning(false)
          toast({
            title: 'Camera Error',
            description: error.message || 'Unable to access camera. Please check permissions.',
            variant: 'destructive',
          })
        }
      }

      startScanning()

      return () => {
        if (html5Qrcode && html5Qrcode.isScanning) {
          html5Qrcode.stop().catch((err: any) => {
            console.error('Error stopping scanner:', err)
          })
        }
      }
    }
  }, [scanning, mode])

  const onScanSuccess = async (decodedText: string) => {
    if (!resource) {
      toast({
        title: 'Error',
        description: 'Resource not available',
        variant: 'destructive',
      })
      return
    }

    const cleanId = extractIdFromQr(decodedText);

    setScanning(false)

    try {
      const endpoint = mode === 'return' ? '/api/scan/return' : '/api/scan'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: cleanId,
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
          description: mode === 'return'
            ? 'Sleeping bag returned successfully'
            : 'Sleeping bag issued successfully',
        })
        fetchBagResource() // Refresh counts
        // Restart scanner after a short delay to allow re-scanning
        setTimeout(() => {
          setResult(null)
          setScanning(true)
        }, 2000)
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

  const handleStartScan = async () => {
    try {
      // Check if camera is available
      const cameraAvailable = await isCameraAvailable()
      if (!cameraAvailable) {
        toast({
          title: 'No Camera Found',
          description: 'No camera device detected. Please connect a camera and try again.',
          variant: 'destructive',
        })
        return
      }

      // Request camera permissions explicitly (helps with Android)
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) {
        toast({
          title: 'Camera Permission Denied',
          description: 'Please allow camera access in your browser settings and try again.',
          variant: 'destructive',
        })
        return
      }

      setScanning(true)
      setResult(null)
      setCameraError(null)
    } catch (error: any) {
      console.error('Camera access error:', error)
      toast({
        title: 'Camera Error',
        description: error.message || 'Failed to access camera. Please check your browser settings.',
        variant: 'destructive',
      })
    }
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
          <h1 className="text-3xl font-bold text-foreground">Sleeping Bag Management</h1>
          <p className="text-muted-foreground">Issue or return sleeping bags</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(value) => {
        setMode(value as Mode)
        setResult(null)
        setScanning(false)
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issue" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Issue Bag
          </TabsTrigger>
          <TabsTrigger value="return" className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Return Bag
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issue" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-indigo-400" />
                Issue Sleeping Bag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center" style={{ minHeight: '400px', aspectRatio: '4/3' }}>
                {!scanning && !result && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center space-y-4 p-8">
                      <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Ready to scan QR code</p>
                    </div>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center space-y-4 p-8">
                      <XCircle className="h-16 w-16 text-destructive mx-auto" />
                      <p className="text-sm text-destructive font-semibold">Camera Error</p>
                      <p className="text-xs text-muted-foreground">{cameraError}</p>
                    </div>
                  </div>
                )}
                {scanning && !cameraError && (
                  <div id="qr-reader-bag-issue" className="w-full h-full absolute inset-0" style={{ zIndex: 1, backgroundColor: '#000' }}></div>
                )}
                {result && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/90">
                    <div className="text-center space-y-4 p-8">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-card-foreground">{result.name}</p>
                            <Badge variant="default" className="text-sm bg-indigo-500">
                              {mode === 'return' ? 'Sleeping bag returned' : 'Sleeping bag issued'}
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
                    disabled={scanning || !resource || !!cameraError}
                    className="flex-1"
                    size="lg"
                  >
                    {scanning ? "Scanning..." : cameraError ? "Retry Camera" : "Start Scan"}
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
        </TabsContent>

        <TabsContent value="return" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-indigo-400" />
                Return Sleeping Bag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center" style={{ minHeight: '400px', aspectRatio: '4/3' }}>
                {!scanning && !result && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center space-y-4 p-8">
                      <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Ready to scan QR code</p>
                    </div>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center space-y-4 p-8">
                      <XCircle className="h-16 w-16 text-destructive mx-auto" />
                      <p className="text-sm text-destructive font-semibold">Camera Error</p>
                      <p className="text-xs text-muted-foreground">{cameraError}</p>
                    </div>
                  </div>
                )}
                {scanning && !cameraError && (
                  <div id="qr-reader-bag-return" className="w-full h-full absolute inset-0" style={{ zIndex: 1, backgroundColor: '#000' }}></div>
                )}
                {result && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/90">
                    <div className="text-center space-y-4 p-8">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-card-foreground">{result.name}</p>
                            <Badge variant="default" className="text-sm bg-indigo-500">
                              {mode === 'return' ? 'Sleeping bag returned' : 'Sleeping bag issued'}
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
                    disabled={scanning || !resource || !!cameraError}
                    className="flex-1"
                    size="lg"
                  >
                    {scanning ? "Scanning..." : cameraError ? "Retry Camera" : "Start Scan"}
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
        </TabsContent>
      </Tabs>

      {resource && (
        <Card className="bg-gradient-to-br from-indigo-500/10 to-primary/10 border-indigo-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bags Remaining</p>
                <p className="text-3xl font-bold text-foreground">{resource.totalQuantity - resource.distributedQuantity}/{resource.totalQuantity}</p>
              </div>
              <BedDouble className="h-12 w-12 text-indigo-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
