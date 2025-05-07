# Cloudflare Dynamic DNS Service Worker

## What is this for?

This solution provides a simple way to obtain a hostname for a dynamic IP address using Cloudflare, for free. It requires you to register a domain on their platform - or migrate an existing domain - but they are really cheap, check it out. 

It makes use of [Cloudflare Workers](https://developers.cloudflare.com/workers/), which are a way of deploying run time code within Cloudflare's cloud platform. If you keep your usage low, you won't get charged. It's free for modest use.

You deploy a service within Cloudflare, and POST a set of security tokens over SSL to it. On receipt of the message, the service picks up the external IP address that the request came from through a header added by Cloudflare, and uses this along with the security tokens you provide to invoke Cloudflare's own APIs to update a DNS record of your choosing. So all you need to do then is create a scheduled job that makes an API call to an HTTPS endpoint with a JSON body that consists of 
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

There is a handy bash script in the utils folder that will find out all the required values for you and create a script to do this. You just then to decide a way to run that script on a regular basis using cron or systemd timers. Up to you.

Whenever you run that script, it will push the required data to the cloudflare worker which will in turn use Cloudflare APIs to update the DNS CNAME (e.g. home.example.com) with whatever your external IP address is. 

The beauty is that Cloudflare will detect your external IP address, and add it as a header to the API call - the Cloudflare worker simply picks this up and uses the token, zone and record id to call a Cloudflare API to update your CNAME.

## Additional Documentation

1. [Create/Migrate Domain on/to Cloudflare](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
2. [Cloudflare DNS service](https://developers.cloudflare.com/dns/)
3. [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create/)

## Procedure

1. Create an account on Cloudflare
2. Migrate/Register a domain name with this account (Zone) e.g. example.com
3. Create a subdomain within that Zone (create a CNAME record in Cloudflare for e.g. home.example.com)
4. Create an Access Token to use with your zone with just these permissions:
    1. Zone -> DNS -> Edit
    2. Include -> Specific Zone -> Your domain
6. Use that token to with /util/create_script.sh passing parameters:
    1. prefix of subdomain e.g. home (must have been already created in step 3 above)
    2. domain to use e.g. example.com
    3. token value created above
8. This will create a file _ddcf-update.sh_
9. Run this using ./ddcf_update.sh to update your CNAME
10. _Optionally_ Schedule a task with e.g. cron to re-run that file every 30 minutes or so

ddcf-update.sh
```
curl -X PATCH "https://ddcf.gravitaz.co.uk/" \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     --data '{"zone_id":"<myzoneid>","dns_record_id":"<mydnsrecordid>"}'
```

### Create your own worker

1. [Install node and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. clone the repo to your local file system - https://cli.github.com/
3. npm install
4. npm run deploy
5. re-run util/create_script.sh passing the resulting cloudflare worker domain name as a 4th parameter
6. bask in a warm sense of accomplishment
