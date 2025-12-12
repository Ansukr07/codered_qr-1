#!/bin/bash
# Generate self-signed SSL certificate for development

mkdir -p ../certs

# Generate private key
openssl genrsa -out ../certs/server.key 2048

# Generate certificate
openssl req -new -x509 -key ../certs/server.key -out ../certs/server.crt -days 365 -subj "/CN=localhost"

echo "✓ SSL certificates generated in backend/certs/"
echo "  - server.key"
echo "  - server.crt"


