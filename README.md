# Cloudflare Dynamic DNS Service Worker

Template below used to create a simple service worker that will accept
a POST of 
```{
    zone_id: value,
    dns_record_id: value,
    token: value
}```

On successful processing, the worker will update the DNS content attribute entry of the relevant dns record to be the apparent 
external IP address from where the request came from. 

1. wrangler login
2. wrangler dev 
3. optional: update wrangler.toml to include your custom route
4. wrangler publish or wrangler publish -e production
5. Use the following example to update the dns record of your own custom hostname

curl -X PATCH "https://ddcf.gravitaz.co.uk/" \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     --data '{"zone_id":"17027e56d602aef10f40f738170c2532","dns_record_id":"bfcd34d794559b5be83c5ccdad028b1d"}'

# ʕ •́؈•̀) `worker-typescript-template`

A batteries included template for kick starting a TypeScript Cloudflare worker project.

## Note: You must use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) 1.17 or newer to use this template.

## 🔋 Getting Started

This template is meant to be used with [Wrangler](https://github.com/cloudflare/wrangler). If you are not already familiar with the tool, we recommend that you install the tool and configure it to work with your [Cloudflare account](https://dash.cloudflare.com). Documentation can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler/).

To generate using Wrangler, run this command:

```bash
wrangler generate my-ts-project https://github.com/cloudflare/worker-typescript-template
```

### 👩 💻 Developing

[`src/index.ts`](./src/index.ts) calls the request handler in [`src/handler.ts`](./src/handler.ts), and will return the [request method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) for the given request.

### 🧪 Testing

This template comes with jest tests which simply test that the request handler can handle each request method. `npm test` will run your tests.

### ✏️ Formatting

This template uses [`prettier`](https://prettier.io/) to format the project. To invoke, run `npm run format`.

### 👀 Previewing and Publishing

For information on how to preview and publish your worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

## 🤢 Issues

If you run into issues with this specific project, please feel free to file an issue [here](https://github.com/cloudflare/worker-typescript-template/issues). If the problem is with Wrangler, please file an issue [here](https://github.com/cloudflare/wrangler/issues).

## ⚠️ Caveats

The `service-worker-mock` used by the tests is not a perfect representation of the Cloudflare Workers runtime. It is a general approximation. We recommend that you test end to end with `wrangler dev` in addition to a [staging environment](https://developers.cloudflare.com/workers/tooling/wrangler/configuration/environments/) to test things before deploying.
