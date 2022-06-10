#!/bin/bash
# use this script to get the list of zone ids associated with the access token
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $1" |
  jq -r '.result[]|"ZONE \(.name) has ID \(.id)"'
