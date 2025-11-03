#!/bin/bash

set -e

echo "=========================================="
echo "CribNosh Cloudflare DNS Setup"
echo "=========================================="

# Check if Cloudflare API token is provided
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "[ERROR] CLOUDFLARE_API_TOKEN environment variable is not set."
    echo ""
    echo "To get your Cloudflare API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Custom token' template"
    echo "4. Set permissions:"
    echo "   - Zone:Zone:Read"
    echo "   - Zone:DNS:Edit"
    echo "5. Zone Resources: Include - Specific zone - cribnosh.co.uk"
    echo "6. Copy the token and run:"
    echo "   export CLOUDFLARE_API_TOKEN='your_token_here'"
    echo "   ./setup-cloudflare-dns.sh"
    echo ""
    exit 1
fi

# App Runner service URL
APP_RUNNER_URL="pmneka8tt7.eu-west-2.awsapprunner.com"
echo "[INFO] App Runner URL: $APP_RUNNER_URL"

# Function to update DNS record
update_dns_record() {
    local domain=$1
    local zone_id=$2
    
    echo "[INFO] Updating DNS for $domain..."
    
    # Get existing A record
    EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?type=A&name=$domain" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id // empty')
    
    if [ -n "$EXISTING_RECORD" ]; then
        echo "[INFO] Updating existing A record for $domain"
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$EXISTING_RECORD" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"CNAME\",\"name\":\"$domain\",\"content\":\"$APP_RUNNER_URL\",\"proxied\":true}" \
            | jq -r '.success'
    else
        echo "[INFO] Creating new CNAME record for $domain"
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"CNAME\",\"name\":\"$domain\",\"content\":\"$APP_RUNNER_URL\",\"proxied\":true}" \
            | jq -r '.success'
    fi
}

# Get zone ID for cribnosh.co.uk
echo "[INFO] Getting zone ID for cribnosh.co.uk..."
ZONE_ID_CO_UK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=cribnosh.co.uk" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id // empty')

if [ -z "$ZONE_ID_CO_UK" ]; then
    echo "[ERROR] Could not find zone for cribnosh.co.uk"
    exit 1
fi

echo "[SUCCESS] Found zone ID for cribnosh.co.uk: $ZONE_ID_CO_UK"

# Get zone ID for cribnosh.com
echo "[INFO] Getting zone ID for cribnosh.com..."
ZONE_ID_COM=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=cribnosh.com" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id // empty')

if [ -z "$ZONE_ID_COM" ]; then
    echo "[ERROR] Could not find zone for cribnosh.com"
    exit 1
fi

echo "[SUCCESS] Found zone ID for cribnosh.com: $ZONE_ID_COM"

# Update DNS records
update_dns_record "cribnosh.co.uk" "$ZONE_ID_CO_UK"
update_dns_record "cribnosh.com" "$ZONE_ID_COM"

echo ""
echo "=========================================="
echo "DNS Update Complete!"
echo "=========================================="
echo "Your domains are now pointing to:"
echo "- https://cribnosh.co.uk -> $APP_RUNNER_URL"
echo "- https://cribnosh.com -> $APP_RUNNER_URL"
echo ""
echo "Note: DNS changes may take a few minutes to propagate."
echo "You can test with:"
echo "  curl -I https://cribnosh.co.uk"
echo "  curl -I https://cribnosh.com"
