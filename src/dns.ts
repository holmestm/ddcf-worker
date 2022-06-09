type CfArgsType = {
  zone_id: string
  dns_record_id: string
  token: string
}

type ZoneData = {
  content: string
  modified_on: string
  name: string
}

type CfApiResponse = {
  success: boolean
  ip?: string
  modified_on?: string
  name?: string
}

const CfDnsRecordResource = async (
  args: CfArgsType,
  options: RequestInitializerDict = {},
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

const getIP: (args: CfArgsType) => Promise<CfApiResponse> = async (args) => {
  return CfDnsRecordResource(args)
}

const setIP: (args: CfArgsType, ip: string) => Promise<CfApiResponse> = async (
  args,
  ip,
) => {
  return CfDnsRecordResource(args, {
    method: 'PATCH',
    body: JSON.stringify({
      content: `${ip}`,
    }),
  })
}

export { getIP, setIP, CfArgsType, CfApiResponse, ZoneData }
