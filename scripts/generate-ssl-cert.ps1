# Generate self-signed SSL certificate for development (PowerShell)

$certsDir = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Force -Path $certsDir | Out-Null

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if ($opensslPath) {
    Write-Host "Using OpenSSL to generate certificates..."
    
    $keyPath = Join-Path $certsDir "server.key"
    $certPath = Join-Path $certsDir "server.crt"
    
    # Generate private key
    openssl genrsa -out $keyPath 2048
    
    # Generate certificate
    openssl req -new -x509 -key $keyPath -out $certPath -days 365 -subj "/CN=localhost"
    
    Write-Host "✓ SSL certificates generated in backend/certs/"
    Write-Host "  - server.key"
    Write-Host "  - server.crt"
} else {
    Write-Host "OpenSSL not found. Please install OpenSSL or use one of these options:"
    Write-Host ""
    Write-Host "Option 1: Install OpenSSL"
    Write-Host "  - Download from: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "  - Or use: choco install openssl"
    Write-Host ""
    Write-Host "Option 2: Use mkcert (Recommended)"
    Write-Host "  - Install: choco install mkcert"
    Write-Host "  - Run: mkcert -install"
    Write-Host "  - Run: mkcert localhost 127.0.0.1"
    Write-Host "  - Move files to backend/certs/"
    Write-Host ""
    Write-Host "Option 3: Manual certificate generation"
    Write-Host "  See: backend/HTTPS_SETUP.md for instructions"
}

