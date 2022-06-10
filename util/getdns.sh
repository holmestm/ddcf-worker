#!/bin/bash
# use this script to get the list of dns record ids associated with specified zone and access token
# pass two parameters - access token, zone id
# you want the id associated with the FQDN you want to associate with your dynamic IP address
curl -X GET "https://api.cloudflare.com/client/v4/zones/$2/dns_records" \
  -H "Authorization: Bearer $1" |
  jq -r '.result[]|"name: \(.name), id \(.id), type \(.type), ip \(.content)"'
