'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle2, XCircle, ArrowLeft, BedDouble } from 'lucide-react'
import Link from 'next/link'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useToast } from '@/hooks/use-toast'

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
}

export default function ScanBagPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; name: string; message?: string } | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBagResource()
  }, [])

  const fetchBagResource = async () => {
    try {
      const res = await fetch('/api/resources')
      const data = await res.json()
      const bagResource = data.resources.find((r: any) =>
        r.name.toLowerCase().includes('bag') || r.name.toLowerCase().includes('sleep')
      )
      setResource(bagResource)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }
  }

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-bag',
        { fps: 10, qrbox: 250 },
        false
      )

      scanner.render(onScanSuccess, onScanError)

      return () => {
        scanner.clear().catch(console.error)
      }
    }
  }, [scanning])

  const extractIdFromQr = (text: string) => {
    try {
      if (text.startsWith('http')) {
        const url = new URL(text);
        const id = url.searchParams.get('id');
        if (id) return id;
      }
      return text;
    } catch (e) {
      return text;
    }
  }

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
      const res = await fetch('/api/scan', {
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
          description: 'Sleeping bag issued successfully',
        })
        fetchBagResource() // Refresh counts
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteer">
          <Button variant="default" size="icon">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scan for Sleeping Bag</h1>
          <p className="text-muted-foreground">Issue sleeping bag to participant</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-indigo-400" />
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
              <div id="qr-reader-bag" className="w-full"></div>
            )}
            {result && (
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-card-foreground">{result.name}</p>
                        <Badge variant="default" className="text-sm bg-indigo-500">
                          Sleeping bag issued
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
