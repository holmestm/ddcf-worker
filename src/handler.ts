import { getIP, setIP, CfArgsType } from './dns'

const getAuthToken = (headers: Headers) => {
  const authHeader = headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const authArray = authHeader.split(' ')
    if (authArray.length == 2) {
      return authArray[1]
    }
  }
  return undefined
}

const updateIP = async (args: CfArgsType, requestIP: string) => {
  let response = await getIP(args)
  if (response) {
    const { ip } = response
    if (ip && ip !== requestIP) {
      response = await setIP(args, requestIP)
    }
  }
  return new Response(JSON.stringify(response), {
    headers: { 'content-type': 'application/json' },
  })
}

export async function handleRequest(request: Request): Promise<Response> {
  const { headers, method } = request
  const externalIP = headers.get('x-real-ip') || headers.get('cf-connecting-ip')

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
      return updateIP({ zone_id, dns_record_id, token }, localIP)
    }
  }
  return new Response('{ "success": false }', {
    status: 406,
    statusText: 'Insufficient or incorrect body content',
    headers: { 'content-type': 'application/json' },
  })
}
