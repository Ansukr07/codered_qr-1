'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, Utensils } from 'lucide-react'
import Link from 'next/link'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useToast } from '@/hooks/use-toast'

interface Resource {
  _id: string
  name: string
}

export default function ScanFoodPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name: string; meal: string; message?: string } | null>(null)
  const [selectedMeal, setSelectedMeal] = useState('Lunch')
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState('')
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
      const scanner = new Html5QrcodeScanner(
        'qr-reader-food',
        { fps: 10, qrbox: 250 },
        false
      )

      scanner.render(onScanSuccess, onScanError)

      return () => {
        scanner.clear().catch(console.error)
      }
    }
  }, [scanning])

  const onScanSuccess = async (decodedText: string) => {
    if (!selectedResourceId) {
      toast({
        title: 'Error',
        description: 'Please select a meal type first',
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
          resource_id: selectedResourceId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          name: data.memberName || "Participant",
          meal: selectedMeal,
          message: data.message
        })
        toast({
          title: 'Success',
          description: `${selectedMeal} recorded successfully`,
        })
      } else {
        setResult({
          success: false,
          name: "Error",
          meal: selectedMeal,
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
        meal: selectedMeal,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteer">
          <Button variant="default" size="icon">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Button>
        </Link>
        <div>
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
              <div id="qr-reader-food" className="w-full"></div>
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
                disabled={scanning || !selectedResourceId}
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
    </div>
  )
}
