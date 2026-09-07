import { Html5Qrcode } from 'html5-qrcode'

/**
 * Camera configuration options for Android compatibility
 */
export interface CameraConfig {
  elementId: string
  onScanSuccess: (decodedText: string) => void
  onScanError?: (errorMessage: string) => void
  fps?: number
  qrbox?: { width: number; height: number } | number
}

/**
 * Attempts to start the camera with multiple fallback strategies for Android compatibility
 */
export async function startCameraWithFallback(
  html5Qrcode: Html5Qrcode,
  config: CameraConfig
): Promise<void> {
  const { elementId, onScanSuccess, onScanError, fps = 10, qrbox = { width: 250, height: 250 } } = config

  // Strategy 1: Try environment (back camera) first
  const strategies: Array<{ facingMode?: string | { exact: string }; deviceId?: { exact: string } }> = [
    { facingMode: 'environment' },
    { facingMode: 'user' },
    { facingMode: { exact: 'environment' } },
    { facingMode: { exact: 'user' } },
  ]

  // Try to get device list and use specific device IDs if available
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    
    // Add device-specific strategies
    for (const device of videoDevices) {
      if (device.deviceId) {
        strategies.push({ deviceId: { exact: device.deviceId } })
      }
    }
  } catch (error) {
    console.warn('Could not enumerate devices:', error)
  }

  let lastError: any = null

  // Try each strategy
  for (const videoConstraints of strategies) {
    try {
      console.log(`Trying camera with constraints:`, videoConstraints)
      
      await html5Qrcode.start(
        videoConstraints,
        {
          fps,
          qrbox,
          aspectRatio: 1.0,
          disableFlip: false,
        },
        onScanSuccess,
        onScanError || (() => {})
      )

      console.log('✅ Camera started successfully with constraints:', videoConstraints)
      return // Success!
    } catch (error: any) {
      console.warn(`Camera start failed with constraints ${JSON.stringify(videoConstraints)}:`, error.message)
      lastError = error
      
      // If scanner was partially started, try to stop it
      try {
        if (html5Qrcode.isScanning) {
          await html5Qrcode.stop()
        }
      } catch (stopError) {
        console.warn('Error stopping scanner:', stopError)
      }
      
      // Continue to next strategy
      continue
    }
  }

  // If all strategies failed, try with minimal constraints
  try {
    console.log('Trying with minimal constraints...')
    await html5Qrcode.start(
      { facingMode: 'environment' },
      {
        fps: 5, // Lower FPS for better compatibility
        qrbox: typeof qrbox === 'number' ? qrbox : Math.min(qrbox.width, qrbox.height),
        aspectRatio: 1.0,
      },
      onScanSuccess,
      onScanError || (() => {})
    )
    console.log('✅ Camera started with minimal constraints')
    return
  } catch (minimalError: any) {
    console.error('All camera strategies failed')
    throw lastError || minimalError
  }
}

/**
 * Requests camera permission explicitly (helps with Android)
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    // Check if permissions API is available
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (permission.state === 'granted') {
        return true
      }
    }

    // Request permission by trying to access camera
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    })
    
    // Stop the stream immediately (we just wanted permission)
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error: any) {
    console.error('Camera permission request failed:', error)
    return false
  }
}

/**
 * Checks if camera is available
 */
export async function isCameraAvailable(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('Error checking camera availability:', error)
    return false
  }
}
