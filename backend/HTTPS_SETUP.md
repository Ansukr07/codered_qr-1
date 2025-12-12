# HTTPS Setup Guide

## Option 1: Self-Signed Certificate (Development)

For local development, you can generate a self-signed certificate:

### Using OpenSSL (Windows/Linux/Mac):

```bash
# Create certs directory
mkdir -p backend/certs

# Generate private key
openssl genrsa -out backend/certs/server.key 2048

# Generate certificate
openssl req -new -x509 -key backend/certs/server.key -out backend/certs/server.crt -days 365 -subj "/CN=localhost"
```

### Using PowerShell (Windows):

```powershell
# Create certs directory
New-Item -ItemType Directory -Force -Path backend\certs

# Generate self-signed certificate
New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyExportPolicy Exportable -KeySpec Signature -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256

# Export certificate (you'll need to do this manually through Certificate Manager)
# Or use OpenSSL if available
```

## Option 2: Use mkcert (Recommended for Local Development)

1. Install mkcert: https://github.com/FiloSottile/mkcert
2. Run:
   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```
3. Move the generated files:
   ```bash
   mv localhost+2.pem backend/certs/server.crt
   mv localhost+2-key.pem backend/certs/server.key
   ```

## Option 3: Production Certificates

For production, use certificates from:
- Let's Encrypt (free)
- Your hosting provider
- A commercial CA

## Configuration

Add to your `.env.local`:

```env
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.crt
HTTPS_PORT=5443
```

## Access

- HTTP: http://localhost:5000
- HTTPS: https://localhost:5443

**Note:** Browsers will show a warning for self-signed certificates. Click "Advanced" → "Proceed to localhost" to continue.


