#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null
then
  echo "OpenSSL could not be found. Please install it and retry."
  exit 1
fi

# Variables
KEY_FILE="nginx.key"
CERT_FILE="nginx.crt"
DAYS_VALID=36500  
KEY_SIZE=2048     
COUNTRY="CH"
STATE="YourState"
LOCALITY="YourCity"
ORGANIZATION="YourOrganization"
ORG_UNIT="YourUnit"
COMMON_NAME="yourdomain.com"

# Run the key and certificate generation
echo "Generating a $KEY_SIZE-bit RSA private key..."
openssl genrsa -out "$KEY_FILE" "$KEY_SIZE"
echo "Private key saved to $KEY_FILE"

echo "Generating a self-signed certificate valid for $DAYS_VALID days..."
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days "$DAYS_VALID" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORG_UNIT/CN=$COMMON_NAME"
echo "Certificate saved to $CERT_FILE"

echo "Nginx SSL key and certificate have been successfully generated."
echo "========================================="
echo "Private Key: $KEY_FILE"
echo "Certificate : $CERT_FILE"
echo "========================================="
echo "Ensure these files are securely stored and referenced in your Nginx configuration."