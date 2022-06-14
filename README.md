# Cloudflare Dynamic DNS Service Worker

![deployment](https://github.com/holmestm/ddcf-worker/actions/workflows/deploy.yml/badge.svg)

## What is this for?

This solution provides a simple way to obtain a hostname for a dynamic IP address using Cloudflare, for free.

It makes use of [Cloudflare Workers](https://developers.cloudflare.com/workers/), which are a way of deploying run time code within Cloudflare's cloud platform. If you keep your usage low, you won't get charged. 

You provision a service within Cloudflare, and POST a set of security tokens over SSL to it. On receipt of the message, the service picks up the external IP address that the request came from through a header added by Cloudflare, and uses this along with the security tokens you provide to invoke Cloudflare's own APIs to update a DNS record of your choosing. So all you need to do then is create a scheduled job that makes an API call to an HTTPS endpoint with a JSON body that consists of 
```
{
    zone_id: <value>,
    dns_record_id: <value>,
    token: <value>
}
```

1. Zone Id - corresponds to your domain e.g. example.com
2. dns_record_id - corresponds to a subdomain e.g. home.example.com
3. token - is a secure token you create within the Cloudflare web portal

## Additional Documentation

1. [Create/Migrate Domain on/to Cloudflare](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
2. [Cloudflare DNS service](https://developers.cloudflare.com/dns/)
3. [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create/)

## Procedure

1. Create an account on Cloudflare
2. Migrate/Register a domain name with this account (Zone)
3. Create a subdomain within that Zone
4. Use the scripts in ./util to determine your zone id and dns record id
5. Create an Access Token to use with your zone
6. Use that token to with the scripts in util - getzone.sh and getdns.sh to get your zone id and dns record id
7. Use those values to update the file util/update.sh
8. Run the update.sh file to update your hostname with your dynamic ip address
9. Schedule a task with crontab to re-run that file every 30 minutes or so

update.sh
```
curl -X PATCH "https://ddcf.gravitaz.co.uk/" \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     --data '{"zone_id":"<myzoneid>","dns_record_id":"<mydnsrecordid>"}'
```

### Optional localIP property

LocalIP allows a IP value to be specified in place of the detected address. Useful for creating DNS entries for local IP ranges for clients that can't use mDNS e.g. Android. 

```
myip=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
curl -X PATCH "https://ddcf.gravitaz.co.uk/" \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     --data '{\
        "zone_id":"17027e56d602aef10f40f738170c2532", \
        "dns_record_id":"bfcd34d794559b5be83c5ccdad028b1d" \
        "localIP":"$myip" \
     }'
```

You probably don't need this, and you can probably do this more simply using a direct API call.
