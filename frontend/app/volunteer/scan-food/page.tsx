'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, Utensils, AlertTriangle, User, Users } from 'lucide-react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
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
  status: 'allowed' | 'claimed'
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
}

export default function ScanFoodPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name: string; meal: string; message?: string } | null>(null)
  const [selectedMeal, setSelectedMeal] = useState('Lunch')
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showClaimedDialog, setShowClaimedDialog] = useState(false)
  const [processingClaim, setProcessingClaim] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchFoodResources()
  }, [])

  const fetchFoodResources = async () => {
    try {
      const res = await fetch('/api/resources')
      const data = await res.json()
      const foodResources = data.resources.filter((r: any) =>
        r.name.toLowerCase().includes('lunch') ||
        r.name.toLowerCase().includes('dinner') ||
        r.name.toLowerCase().includes('breakfast') ||
        r.name.toLowerCase().includes('food')
      )
      setResources(foodResources)
      if (foodResources.length > 0) {
        // Auto-select first resource
        setSelectedResourceId(foodResources[0]._id)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }
  }

  useEffect(() => {
    if (scanning) {
      setCameraError(null)
      let html5Qrcode: any = null

      const startScanning = async () => {
        try {
          html5Qrcode = new Html5Qrcode('qr-reader-food')
          
          await html5Qrcode.start(
            { facingMode: "user" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText: string) => {
              onScanSuccess(decodedText)
            },
            (errorMessage: string) => {
              // Ignore continuous scan errors
              if (errorMessage && !errorMessage.includes('NotFoundException')) {
                console.log('Scan error:', errorMessage)
              }
            }
          )
          
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
  }, [scanning])

  // Removed local extractIdFromQr definition

  const onScanSuccess = async (decodedText: string) => {
    if (!selectedResourceId) {
      toast({
        title: 'Error',
        description: 'Please select a meal type first',
        variant: 'destructive',
      })
      return
    }

    const cleanId = extractIdFromQr(decodedText);

    // Prevent multiple scans of the same code while processing
    if (cleanId === lastScannedCode && (showConfirmDialog || showClaimedDialog)) {
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
          } else if (data.status === 'claimed') {
            console.log('⚠️ [Scan] Status Claimed -> Showing Claimed Dialog')
            setShowClaimedDialog(true)
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
        setResult({
          success: true,
          name: data.memberName || validationResult.member.name,
          meal: selectedMeal,
          message: data.message
        })
        toast({
          title: 'Success',
          description: `${selectedMeal} recorded successfully`,
        })
        setShowConfirmDialog(false)
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
    // Check if camera is available
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasCamera = devices.some(device => device.kind === 'videoinput')
      
      if (!hasCamera) {
        toast({
          title: 'No Camera Found',
          description: 'No camera device detected. Please connect a camera and try again.',
          variant: 'destructive',
        })
        return
      }

      // Request camera permissions
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (permError: any) {
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          toast({
            title: 'Camera Permission Denied',
            description: 'Please allow camera access in your browser settings and try again.',
            variant: 'destructive',
          })
          return
        } else if (permError.name === 'NotFoundError' || permError.name === 'DevicesNotFoundError') {
          toast({
            title: 'No Camera Found',
            description: 'No camera device found. Please connect a camera and try again.',
            variant: 'destructive',
          })
          return
        }
        throw permError
      }

      setScanning(true)
      setResult(null)
      setValidationResult(null)
      setLastScannedCode('')
      setShowConfirmDialog(false)
      setShowClaimedDialog(false)
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
          <h1 className="text-3xl font-bold text-foreground">Scan for Food</h1>
          <p className="text-muted-foreground">Scan participant QR to record meal</p>
        </div>
      </div>

      {/* Scanner Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Preview Area */}
          <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-secondary/50 border-2 border-dashed border-border" style={{ minHeight: '400px' }}>
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
              <div id="qr-reader-food" className="w-full h-full" style={{ position: 'relative', zIndex: 1, backgroundColor: '#000', minHeight: '400px' }}></div>
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
                          {result.meal} recorded
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
                disabled={scanning || !selectedResourceId || !!cameraError}
                className="flex-1"
                size="lg"
              >
                {scanning ? "Scanning..." : cameraError ? "Retry Camera" : "Start Scan"}
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

      {/* Meal Type Selection */}
      {!result && resources.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Select Meal Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {resources.map((resource) => {
                const isSelected = selectedResourceId === resource._id
                const emoji = resource.name.toLowerCase().includes('breakfast') ? '🌅' :
                  resource.name.toLowerCase().includes('lunch') ? '🌞' : '🌙'

                return (
                  <Button
                    key={resource._id}
                    variant="outline"
                    className={`h-auto py-3 flex flex-col gap-2 ${isSelected ? 'border-primary text-primary' : ''}`}
                    onClick={() => {
                      setSelectedResourceId(resource._id)
                      setSelectedMeal(resource.name)
                    }}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm text-card-foreground">{resource.name}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Claim</DialogTitle>
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

      {/* Already Claimed Dialog */}
      <Dialog open={showClaimedDialog} onOpenChange={setShowClaimedDialog}>
        <DialogContent className="sm:max-w-md border-orange-500/50">
          <DialogHeader>
            <DialogTitle className="text-orange-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Already Claimed
            </DialogTitle>
            <DialogDescription>
              This participant has already claimed this resource.
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
                  <span className="text-muted-foreground">Claimed At:</span>
                  <span className="font-medium">
                    {validationResult.transaction?.timestamp ? new Date(validationResult.transaction.timestamp).toLocaleString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volunteer:</span>
                  <span className="font-medium">
                    {validationResult.transaction?.volunteerName || 'Unknown'}
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
    </div>
  )
}
