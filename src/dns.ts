type cfArgsType = {
  zone_id: string
  dns_record_id: string
  token: string
}

type ZoneData = {
  content: string
  modified_on: string
  name: string
}

const callCF = async (
  args: cfArgsType,
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

  const results: {
    success: boolean
    result: ZoneData
  } = await response.json()

  if (results.success) {
    const { content, modified_on, name } = results.result
    return { ip: content, modified_on, name, success: true }
  } else {
    return { success: false }
  }
}

const getIP = async (args: cfArgsType) => {
  return callCF(args)
}

const setIP = async (args: cfArgsType, ip: string) => {
  return callCF(args, {
    method: 'PATCH',
    body: JSON.stringify({
      content: `${ip}`,
    }),
  })
}

export { getIP, setIP, cfArgsType }
