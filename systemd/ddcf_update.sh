#!/bin/bash
# move to /usr/local/bin
# move ddcf.service and ddcf.timer to /etc/systemd
# use create_ini.sh to create a secrets file and store somewhere secure like /root/.secrets/cloudflare.init
# ensure reference is correct in ddcf.service

# Retrieve credentials from systemd
SECRET_FILE="$CREDENTIALS_DIRECTORY/cloudflare.ini"

if [ -f "$SECRET_FILE" ]; then
    # Extract values from the INI format using grep and xargs
    TOKEN=$(grep 'dns_cloudflare_api_token' "$SECRET_FILE" | cut -d '=' -f2 | xargs)
    ZONE_ID=$(grep 'zone_id' "$SECRET_FILE" | cut -d '=' -f2 | xargs)
    ZONE_RECORD_ID=$(grep 'zone_record_id' "$SECRET_FILE" | cut -d '=' -f2 | xargs)
else
    echo "Error: Credential file not found at $SECRET_FILE"
    exit 1
fi

# Validate that we found all required values
if [[ -z "$TOKEN" || -z "$ZONE_ID" || -z "$ZONE_RECORD_ID" ]]; then
    echo "Error: Missing one or more required values in $SECRET_FILE"
    exit 1
fi

# Execute the update
curl -X PATCH "https://ddcf.gravitaz.co.uk" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"zone_id\":\"$ZONE_ID\",\"dns_record_id\":\"$ZONE_RECORD_ID\"}"
