#!/bin/bash
if [[ $# -eq 0 ]] ; then
    echo 'args: 1 - token'
    return
fi
export TOKEN=${1:?"Cloudflare auth token"}
# export ZONE_ID=${2:?"Zone ID"}
# use this script to get the list of zone ids associated with the access token
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $TOKEN" |
  jq -r '.result[]|"ZONE \(.name) has ID \(.id)"'
