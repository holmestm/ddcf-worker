import { getIP, setIP, CfArgsType } from './dns'

const getAuthToken = (headers: Headers) => {
  const authHeader = headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ').splice(1).join(' ');
  }
  return undefined;
}

const updateIP = async (args: CfArgsType, requestIP: string, countryCode: string = 'ZZ') => {
  let response = await getIP(args)
  if (response) {
    const { ip } = response
    if (ip && ip !== requestIP) {
      response = await setIP(args, requestIP)
    }
  }
  return new Response(JSON.stringify({ countryCode, ...response }), {
    headers: { 'content-type': 'application/json' },
  })
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const { headers, method } = request
  const externalIP = headers.get('x-real-ip') || headers.get('cf-connecting-ip')
  const externalCountry = headers.get('cf-ipcountry') || 'XX';

  if (env.VALID_COUNTRIES && externalCountry && !env.VALID_COUNTRIES.split(',').includes(externalCountry)) {
    return new Response(`{ "success": false, "countryCode": "${externalCountry}" }`, {
      status: 406,
      statusText: 'Unsupported country',
      headers: { 'content-type': 'application/json' },
    })
  };

  if (!externalIP) {
    return new Response(`{ "success": false, "externalIP": "${externalIP}" }`, {
      status: 500,
      statusText: 'Unable to determine external IP',
      headers: { 'content-type': 'application/json' },
    })
  }

  if (method == 'POST' && externalIP) {
    const body: Record<string, unknown> = await request.json()
    const { zone_id, dns_record_id, token, localIP } = {
      zone_id: '',
      dns_record_id: '',
      token: getAuthToken(headers) || '',
      localIP: externalIP,
      ...body,
    }
    if (zone_id && dns_record_id && token) {
      return updateIP({ zone_id, dns_record_id, token }, localIP, externalCountry)
    }
  }
  return new Response('{ "success": false }', {
    status: 406,
    statusText: 'Insufficient or incorrect body content',
    headers: { 'content-type': 'application/json' },
  })
}
