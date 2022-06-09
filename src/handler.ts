import { getIP, setIP, cfArgsType } from './dns'

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

const updateIP = async (args: cfArgsType, requestIP: string) => {
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

export async function handleRequest(request: Request) {
  let { headers } = request
  let requestIP = headers.get('x-real-ip') || headers.get('cf-connecting-ip')

  if (request.method == 'POST' && requestIP) {
    const body: Object = await request.json()
    let { zone_id, dns_record_id, token } = {
      zone_id: '',
      dns_record_id: '',
      token: getAuthToken(headers) || '',
      ...body,
    }
    if (zone_id && dns_record_id && token) {
      return await updateIP({ zone_id, dns_record_id, token }, requestIP)
    }
  }
  return new Response('{ "success": false }', {
    status: 406,
    statusText: 'Insufficient or incorrect body content',
    headers: { 'content-type': 'application/json' },
  })
}
