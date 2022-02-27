import { getIP, setIP, cfArgsType } from './dns'

export async function handleRequest(request: Request) {
  let { headers } = request
  let requestIP = headers.get('x-real-ip') || headers.get('cf-connecting-ip')
  const headerToken = getAuthToken(headers)

  if (request.method == 'POST' && request.body && requestIP) {
    const body: Object = await request.json()
    if (
      body.hasOwnProperty('zone_id') &&
      body.hasOwnProperty('dns_record_id') &&
      (body.hasOwnProperty('token') || headerToken)
    ) {
      const args = { token: headerToken, ...body } as cfArgsType
      let response = await getIP(args)
      if (response) {
        const { ip, modified_on } = response
        if (ip && ip !== requestIP) {
          console.log('changing dns entry')
          response = await setIP(args, requestIP)
        } else {
          console.log('dns unchanged')
        }
      }
      return new Response(
        JSON.stringify({
          ...response,
        }),
        {
          headers: { 'content-type': 'application/json' },
        },
      )
    }
  }
  return new Response('{ error: true }', {
    headers: { 'content-type': 'application/json' },
  })
}
function getAuthToken(headers: Headers) {
  const authHeader = headers.get('authorization')
  if (authHeader && authHeader?.startsWith('Bearer ')) {
    const authArray = authHeader.split(' ')
    if (authArray.length == 2) {
      return authArray[1]
    }
  }
  return undefined
}
