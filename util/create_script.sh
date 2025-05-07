#!/bin/bash
PREFIX=${1:-"$PREFIX"}
DOMAIN=${2:-"$DOMAIN"}
TOKEN=${3:-"$TOKEN"}
WORKER=${4:-"$WORKER"}
if [[ -z "$PREFIX" || -z "$DOMAIN" || -z "$TOKEN" ]]; then
  echo "Pass args 1:PREFIX, 2:DOMAIN, 3:TOKEN else define as environment variables"
  exit 1
fi
if [[ -z "$WORKER" ]]; then
  WORKER="ddcf.gravitaz.co.uk"
fi
echo "Creating ddcf script for $PREFIX.$DOMAIN"
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
cat <<EOF > ddcf-update.sh
#!/bin/bash
curl -X POST "https://$WORKER" \\
     -H "Authorization: Bearer $TOKEN" \\
     -H "Content-Type: application/json" \\
     --data '$DATA'
EOF
chmod +x ddcf-update.sh
echo "Created ddcf-update.sh with"
cat ddcf-update.sh

