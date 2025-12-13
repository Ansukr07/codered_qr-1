'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, Coffee, AlertTriangle, User, Users } from 'lucide-react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { startCameraWithFallback, requestCameraPermission, isCameraAvailable } from '@/lib/camera-utils'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { extractIdFromQr } from '@/lib/utils'

interface Resource {
  _id: string
  name: string
}

interface ValidationResult {
  status: 'allowed' | 'claimed' | 'limit_reached'
  message: string
  member: {
    name: string
    teamId: string
    email: string
  }
  transaction?: {
    timestamp: string
    volunteerName: string
  }
  claimCount?: number
  maxClaims?: number
}

export default function ScanCoffeePage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name: string; message?: string; claimCount?: number; maxClaims?: number } | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showClaimedDialog, setShowClaimedDialog] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [processingClaim, setProcessingClaim] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchCoffeeResources()
  }, [])

  const fetchCoffeeResources = async () => {
    try {
      const res = await fetch('/api/resources')
      const data = await res.json()
      console.log('All resources:', data.resources)
      const coffeeResources = data.resources.filter((r: any) =>
        r.category === 'coffee' || r.name.toLowerCase().includes('coffee')
      )
      console.log('Coffee resources found:', coffeeResources)
      setResources(coffeeResources)
      if (coffeeResources.length > 0) {
        // Auto-select first resource
        setSelectedResourceId(coffeeResources[0]._id)
        console.log('Auto-selected resource:', coffeeResources[0]._id)
      } else {
        console.warn('No coffee resources found. Please create a coffee resource in the admin panel.')
        toast({
          title: 'No Coffee Resource Found',
          description: 'Please create a coffee resource in the admin panel first.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch resources. Please try again.',
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
          html5Qrcode = new Html5Qrcode('qr-reader-coffee')

          await startCameraWithFallback(html5Qrcode, {
            elementId: 'qr-reader-coffee',
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
            description: error.message || 'Unable to access camera. Please check permissions and try again.',
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
  }, [scanning])

  const onScanSuccess = async (decodedText: string) => {
    if (!selectedResourceId) {
      toast({
        title: 'Error',
        description: 'Please select a coffee resource first',
        variant: 'destructive',
      })
      return
    }

    const cleanId = extractIdFromQr(decodedText);

    // Prevent multiple scans of the same code while processing (but allow re-scanning after completion)
    if (cleanId === lastScannedCode && (showConfirmDialog || showClaimedDialog || showLimitDialog || processingClaim)) {
      return
    }

    setScanning(false)
    setLastScannedCode(cleanId)

    // Small delay to allow scanner to cleanup
    setTimeout(async () => {
      try {
        console.log('🔍 [Scan] Validating QR:', cleanId)
        // Step 1: Validate
        const res = await fetch('/api/scan/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qr_code: cleanId,
            resource_id: selectedResourceId,
          }),
        })

        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('❌ [Scan] Non-JSON response:', text.substring(0, 200))
          throw new Error('Server returned non-JSON response. Please check the API endpoint.')
        }

        const data = await res.json()
        console.log('🔍 [Scan] Validation Response:', data)

        if (res.ok) {
          setValidationResult(data)
          if (data.status === 'allowed') {
            console.log('✅ [Scan] Status Allowed -> Showing Confirm Dialog')
            setShowConfirmDialog(true)
          } else if (data.status === 'claimed' || data.status === 'limit_reached') {
            if (data.claimCount >= data.maxClaims) {
              console.log('⚠️ [Scan] Limit Reached -> Showing Limit Dialog')
              setShowLimitDialog(true)
            } else {
              console.log('⚠️ [Scan] Status Claimed -> Showing Claimed Dialog')
              setShowClaimedDialog(true)
            }
          } else {
            console.warn('❓ [Scan] Unknown status:', data.status)
          }
        } else {
          console.error('❌ [Scan] Validation failed:', data)
          toast({
            title: 'Error',
            description: data.message || 'Validation failed',
            variant: 'destructive',
          })
          // Restart scanning after error
          setTimeout(() => setScanning(true), 2000)
        }
      } catch (error) {
        console.error('❌ [Scan] Validation error:', error)
        toast({
          title: 'Error',
          description: 'Failed to validate scan',
          variant: 'destructive',
        })
        setTimeout(() => setScanning(true), 2000)
      }
    }, 300)
  }

  const handleConfirmClaim = async () => {
    if (!validationResult || !lastScannedCode) return

    setProcessingClaim(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: lastScannedCode,
          resource_id: selectedResourceId,
        }),
      })

      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('❌ [Scan] Non-JSON response:', text.substring(0, 200))
        throw new Error('Server returned non-JSON response. Please check the API endpoint.')
      }

      const data = await res.json()

      if (res.ok) {
        // Fetch updated claim count
        const validateRes = await fetch('/api/scan/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qr_code: lastScannedCode,
            resource_id: selectedResourceId,
          }),
        })
        const validateData = await validateRes.json()
        
        setResult({
          success: true,
          name: data.memberName || validationResult.member.name,
          message: data.message,
          claimCount: validateData.claimCount || (validationResult.claimCount ? validationResult.claimCount + 1 : 1),
          maxClaims: validateData.maxClaims || validationResult.maxClaims || 3
        })
        toast({
          title: 'Success',
          description: `Coffee recorded successfully`,
        })
        setShowConfirmDialog(false)
        // Reset state to allow re-scanning
        setLastScannedCode('')
        setValidationResult(null)
        // Restart scanner after a short delay
        setTimeout(() => {
          setResult(null)
          setScanning(true)
        }, 2000)
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process claim',
        variant: 'destructive',
      })
    } finally {
      setProcessingClaim(false)
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
      setValidationResult(null)
      setLastScannedCode('')
      setShowConfirmDialog(false)
      setShowClaimedDialog(false)
      setShowLimitDialog(false)
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Scan for Coffee</h1>
          <p className="text-muted-foreground">Scan participant QR to record coffee (Max 3 per participant)</p>
        </div>
      </div>

      {/* Scanner Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Preview Area */}
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
              <div id="qr-reader-coffee" className="w-full h-full absolute inset-0" style={{ zIndex: 1, backgroundColor: '#000' }}></div>
            )}
            {result && (
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-card-foreground">{result.name}</p>
                        <Badge variant="default" className="text-sm bg-green-500">
                          Coffee recorded ({result.claimCount}/{result.maxClaims})
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!result ? (
              <Button
                onClick={handleStartScan}
                disabled={scanning || !selectedResourceId || !!cameraError || resources.length === 0}
                className="flex-1"
                size="lg"
              >
                {scanning ? "Scanning..." : cameraError ? "Retry Camera" : !selectedResourceId ? "Select Coffee Resource First" : "Start Scan"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStartScan}
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

      {/* Coffee Resource Selection */}
      {!result && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Select Coffee Resource</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <Coffee className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">No Coffee Resource Found</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please create a coffee resource in the admin panel first.
                  </p>
                </div>
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Go to Admin Panel
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {resources.map((resource) => {
                  const isSelected = selectedResourceId === resource._id

                  return (
                    <Button
                      key={resource._id}
                      variant="outline"
                      className={`h-auto py-3 flex flex-col gap-2 ${isSelected ? 'border-primary text-primary bg-primary/5' : ''}`}
                      onClick={() => {
                        setSelectedResourceId(resource._id)
                        console.log('Selected resource:', resource._id, resource.name)
                      }}
                    >
                      <Coffee className="h-5 w-5 mx-auto" />
                      <span className="text-sm text-card-foreground">{resource.name}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-xs mt-1">
                          Selected
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Coffee Claim</DialogTitle>
            <DialogDescription>
              Please verify the participant details before proceeding.
            </DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="p-3 bg-primary/20 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participant</p>
                  <p className="font-bold text-lg">{validationResult.member.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team ID</p>
                  <p className="font-bold text-lg">{validationResult.member.teamId || 'N/A'}</p>
                </div>
              </div>
              {validationResult.claimCount !== undefined && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Coffee Count</p>
                  <p className="font-bold text-lg text-blue-500">
                    {validationResult.claimCount} / {validationResult.maxClaims || 3}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => {
              setShowConfirmDialog(false)
              handleStartScan()
            }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmClaim} disabled={processingClaim}>
              {processingClaim ? 'Processing...' : 'Confirm & Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Already Claimed Dialog (but not at limit) */}
      <Dialog open={showClaimedDialog} onOpenChange={setShowClaimedDialog}>
        <DialogContent className="sm:max-w-md border-orange-500/50">
          <DialogHeader>
            <DialogTitle className="text-orange-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Coffee Already Claimed
            </DialogTitle>
            <DialogDescription>
              This participant has already claimed coffee. They can claim up to 3 times.
            </DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="p-3 bg-primary/20 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participant</p>
                  <p className="font-bold text-lg">{validationResult.member.name}</p>
                </div>
              </div>
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Count:</span>
                  <span className="font-medium">
                    {validationResult.claimCount || 0} / {validationResult.maxClaims || 3}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Claimed:</span>
                  <span className="font-medium">
                    {validationResult.transaction?.timestamp ? new Date(validationResult.transaction.timestamp).toLocaleString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="default" onClick={() => {
              setShowClaimedDialog(false)
              handleStartScan()
            }}>
              Scan Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Reached Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Maximum Limit Reached
            </DialogTitle>
            <DialogDescription>
              This participant has reached the maximum limit of 3 coffees.
            </DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="p-3 bg-primary/20 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participant</p>
                  <p className="font-bold text-lg">{validationResult.member.name}</p>
                </div>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coffee Count:</span>
                  <span className="font-medium text-red-500">
                    {validationResult.claimCount || 3} / {validationResult.maxClaims || 3}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="default" onClick={() => {
              setShowLimitDialog(false)
              handleStartScan()
            }}>
              Scan Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

