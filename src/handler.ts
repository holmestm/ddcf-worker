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

  if (method !== 'POST') {
    return new Response(JSON.stringify({ success: false }), {
      status: 405,
      statusText: 'Method Not Allowed',
      headers: { 'content-type': 'application/json' },
    })
  }

  const externalIP = headers.get('x-real-ip') || headers.get('cf-connecting-ip')
  const externalCountry = headers.get('cf-ipcountry') || 'XX';

  if (env.VALID_COUNTRIES && externalCountry && !env.VALID_COUNTRIES.split(',').includes(externalCountry)) {
    return new Response(JSON.stringify({ success: false, countryCode: externalCountry }), {
      status: 406,
      statusText: 'Unsupported country',
      headers: { 'content-type': 'application/json' },
    })
  };

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      statusText: 'Invalid JSON',
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!externalIP) {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      statusText: 'Unable to resolve external IP',
      headers: { 'content-type': 'application/json' },
    })
  }

  const { zone_id, dns_record_id, token, localIP } = {
    zone_id: '',
    dns_record_id: '',
    token: getAuthToken(headers) || '',
    localIP: externalIP,
    ...body,
  }

  if (!zone_id || !dns_record_id || !token) {
    return new Response(JSON.stringify({ success: false }), {
      status: 406,
      statusText: 'Insufficient or incorrect body content',
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!localIP) {
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      statusText: 'Unable to resolve new IP',
      headers: { 'content-type': 'application/json' },
    })
  }

  return updateIP({ zone_id, dns_record_id, token }, localIP, externalCountry)
}
