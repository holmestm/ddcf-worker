type CFArgsType = {
  zone_id: string
  dns_record_id: string
  token: string
}

type ZoneData = {
  content: string
  modified_on: string
  name: string
}

type CFApiResponse = {
  success: boolean
  ip?: string
  modified_on?: string
  name?: string
}

const cfDnsRecordResource = async (
  args: CFArgsType,
  options: Record<string, any> = {},
) => {
  const { zone_id, dns_record_id, token } = args
  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records/${dns_record_id}`

  const init = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
    ...options,
  }

  const response = await fetch(url, init)

  const responseJSON: any = await response.json()

  const { success, result } = responseJSON

  if (success) {
    const { content, modified_on, name } = result
    return { ip: content, modified_on, name, success: true }
  } else {
    return { ...responseJSON }
  }
}

const getIP: (args: CFArgsType) => Promise<CFApiResponse> = async (args) => {
  return cfDnsRecordResource(args)
}

const setIP: (args: CFArgsType, ip: string) => Promise<CFApiResponse> = async (
  args,
  ip,
) => {
  return cfDnsRecordResource(args, {
    method: 'PATCH',
    body: JSON.stringify({
      content: `${ip}`,
    }),
  })
}

export { getIP, setIP }

export type { CFArgsType as CfArgsType, CFApiResponse as CfApiResponse, ZoneData }