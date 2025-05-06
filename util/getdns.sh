#!/bin/bash
if [[ $# -eq 0 ]] ; then
    echo 'args: 1 - token, 2 - Zone ID'
    exit 1
fi
export TOKEN=${1:?"Cloudflare auth token"}
export ZONE_ID=${2:?"Zone ID"}
# use this script to get the list of dns record ids associated with specified zone and access token
# pass two parameters - access token, zone id
# you want the id associated with the FQDN you want to associate with your dynamic IP address
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $TOKEN" |
  jq -r '.result[]|"name: \(.name), id \(.id), type \(.type), ip \(.content)"'
