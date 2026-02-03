# Cloudflare Dynamic DNS Service Worker

Experimental!

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=ddcf-worker)

## What is this for?

This is a dynamic ip address solution for Cloudflare users. 
A small piece of code is hosted as an API on Cloudflare's platform, and on receipt of a suitable HTTP POST request will update the CNAME of a specified DNS record with the IP address that Cloudflare detects - meaning no need to make a separate call out to 'whatsmyip' or whatever. Importantly no private information is stored on Cloudflare - all required information is provided as part of the message, see below.
It requires you to use a domain managed on their platform, which may require you to migrate an existing domain - but they are really cheap, check it out. 
I provide a small shell script that will help you create a small shell script that can be used to keep the DNS entry up to date - it's up to you to work out how to schedule when and how that script is run. Update: I've added some systemd files to help with this.

### Tech Details

The solution makes use of [Cloudflare Workers](https://developers.cloudflare.com/workers/).

You deploy a worker service within Cloudflare, and POST a set of security tokens over SSL to it. 

Cloudflare adds a the 'X-real-ip' header to the call, which contains your external IP address. You also post additional information that can be used in a cloudflare API call to update the CNAME entry.

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

Use the provided ./util/create_script.sh to create a script `ddcf-update.sh` by passing it parameters on the command line for

1. PREFIX - subdomain e.g. home
2. DOMAIN - the domain you registered with Cloudflare e.g. mydomain.com
3. TOKEN - a secret token you create using the Cloudflare dashboard
4. WORKER - the hostname of the worker you deploy on Cloudflare

Once you have deployed your worker, you can run this script to check it is all working. You are welcome to use my server for now (unless usage starts to exceed my free limit, and now only if you live in the UK) but be aware you will be sending your secret tokens to my worker which you might want to consider.

## Additional Documentation

1. [Create/Migrate Domain on/to Cloudflare](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
2. [Cloudflare DNS service](https://developers.cloudflare.com/dns/)
3. [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create/)

## Onboarding Process

1. Create an account on Cloudflare
2. Migrate/Register a domain name with this account (Zone) e.g. example.com
3. Create a subdomain within that Zone (create a CNAME record in Cloudflare for e.g. home.example.com)
4. Create an Access Token to use with your zone with just these permissions:
    1. Zone -> DNS -> Edit
    2. Include -> Specific Zone -> Your domain
6. Use that token to with /util/create_script.sh passing parameters:
    1. PREFIX - subdomain e.g. home
    2. DOMAIN - the domain you registered with Cloudflare e.g. mydomain.com
    3. TOKEN - a secret token you create using the Cloudflare dashboard
    4. WORKER - the hostname of the worker you deploy on Cloudflare
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

Manual approach...

1. [Install node and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. clone this repo to your local file system - https://cli.github.com/
3. npm install
4. npm run deploy - observe the cloudflare worker domain
5. re-run util/create_script.sh passing the resulting cloudflare worker domain name as a 4th parameter
6. use cron or whatever to schedule the regular running of the ddcf-update.sh script

## Systemd

In the systemd subdirectory, I've provided a service and timer file for use with systemd. Use the supplied script to create a 'secrets' file in much the same way as ddcf-update.sh above. 
On my system I place this under /root/.secrets then update the ddcf.service file to reference that file then 

```
sudo mv ddcf.service /etc/systemd/system/
sudo mv ddcf.timer /etc/systemd/system/
sudo chmod 644 /etc/systemd/system/ddcf.service
sudo chmod 644 /etc/systemd/system/ddcf.timer
sudo systemctl daemon-reload
sudo systemctl enable --now ddcf.timer
```


