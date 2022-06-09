# Cloudflare Dynamic DNS Service Worker

![deployment](https://github.com/holmestm/ddcf-worker/actions/workflows/deploy.yml/badge.svg)

Template below used to create a simple service worker that will accept a POST body of 

```
{
    zone_id: <value>,
    dns_record_id: <value>,
    token: <value>
}
```

On successful processing, the worker will update the DNS content attribute entry of the relevant dns record to be the apparent external IP address from where the request came from. 

1. wrangler login
2. wrangler dev 
3. optional: update wrangler.toml to include your custom route
4. wrangler publish or wrangler publish -e production
5. Use the following example to update the dns record of your own custom hostname

```
curl -X PATCH "https://ddcf.gravitaz.co.uk/" \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     --data '{"zone_id":"17027e56d602aef10f40f738170c2532","dns_record_id":"bfcd34d794559b5be83c5ccdad028b1d"}'
```
