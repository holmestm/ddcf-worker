#!/bin/bash
# run with (e.g.) ./create_ini.sh home mydomain.com ***MYTOKEN*** - assuming you want the service to update the CNAME of home.mydomain.com 
# so that it resolves your current dynamic ip address. 
# This script will create a cloudflare.ini file, move this to a location that can be found by ddcf.service e.g. /root/.secrets/cloudflare.ini
# ensure it is secure e.g. chmod 600 cloudflare.ini && chown root:root cloudflare.ini

PREFIX=${1:-"$PREFIX"}
DOMAIN=${2:-"$DOMAIN"}
TOKEN=${3:-"$TOKEN"}
if [[ -z "$PREFIX" || -z "$DOMAIN" || -z "$TOKEN" ]]; then
  echo "Pass args 1:PREFIX, 2:DOMAIN, 3:TOKEN else define as environment variables"
  exit 1
fi
echo "Creating cloudflare.ini file for $PREFIX.$DOMAIN"
echo "Resolving zone id for $DOMAIN..."
ZONE_ID=$(curl -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN"   -H "Authorization: Bearer $TOKEN" |   jq -r '.result[]|"\(.id)"')
if [[ -z "$ZONE_ID" ]]; then
    echo "Unable to resolve $DOMAIN - does the zone exist, does your token have sufficient permission?"
    exit 1
fi
echo "ZONE_ID: $DOMAIN=>$ZONE_ID"
echo "Resolving record id for $PREFIX.$DOMAIN"
RECORD_ID=$(curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$PREFIX.$DOMAIN" -H "Authorization: Bearer $TOKEN" | jq -r '.result[]|"\(.id)"')
if [[ -z "$RECORD_ID" ]]; then
    echo "Unable to resolve $PREFIX.$DOMAIN - does the subdomain exist, does your token have sufficient permission?"
    exit 1
fi
echo "RECORD_ID: $PREFIX.$DOMAIN=>$RECORD_ID"
DATA="{\"zone_id\":\"${ZONE_ID}\",\"dns_record_id\":\"${RECORD_ID}\"}"
cat <<EOF > cloudflare.ini
dns_cloudflare_api_token = $TOKEN
zone_id = $ZONE_ID
zone_record_id = $RECORD_ID
EOF
echo "Created cloudflare.ini with"
cat cloudflare.ini
echo "Move this to (e.g.) /root/.secrets/cloudflare.ini"
