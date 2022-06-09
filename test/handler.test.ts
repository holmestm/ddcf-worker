import { handleRequest } from '../src/handler'
import { enableFetchMocks, MockParams } from 'jest-fetch-mock'
import * as dns from '../src/dns'
import makeServiceWorkerEnv from 'service-worker-mock'

enableFetchMocks()
const getIP = jest.spyOn(dns, 'getIP')
const setIP = jest.spyOn(dns, 'setIP')

const sampleResponse = {
  result: {
    id: 'ZZZ',
    zone_id: 'XXX',
    zone_name: 'gravitaz.co.uk',
    name: 'uk.gravitaz.co.uk',
    type: 'A',
    content: '127.0.0.1',
    proxiable: false,
    proxied: false,
    ttl: 60,
    locked: false,
    meta: {
      auto_added: false,
      managed_by_apps: false,
      managed_by_argo_tunnel: false,
      source: 'primary',
    },
    created_on: '2022-02-09T12:19:58.579659Z',
    modified_on: '2022-03-07T23:18:46.259094Z',
  },
  success: true,
  errors: [],
  messages: [],
}

const oldIP = '1.2.3.5'
const newIP = '1.2.3.4'
const lclIP = '192.168.0.123'

const responses = [
  JSON.parse(JSON.stringify({ ...sampleResponse, result: { content: oldIP } })),
  JSON.parse(JSON.stringify({ ...sampleResponse, result: { content: newIP } })),
  JSON.parse(JSON.stringify({ ...sampleResponse, result: { content: lclIP } })),
]

const mockedResponses = responses.map((x) => JSON.stringify(x))

//const it1 = (_a: unknown, _b: unknown) => true

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
    fetchMock.resetMocks()
    fetchMock.mockResponses(...mockedResponses)
  })

  afterEach(() => {
    getIP.mockClear()
    setIP.mockClear()
  })

  const headersMap = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-real-ip': '',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  it('mocks work as expected', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const { ip: ip1 } = await dns.getIP(payload)
    const { ip: ip2 } = await dns.getIP(payload)
    const { ip: ip3 } = await dns.getIP(payload)
    expect(ip1).toBe(oldIP)
    expect(ip2).toBe(newIP)
    expect(ip3).toBe(lclIP)
  })

  it('mocks work as expected again', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const { ip: ip1 } = await dns.getIP(payload)
    const { ip: ip2 } = await dns.getIP(payload)
    const { ip: ip3 } = await dns.getIP(payload)
    expect(ip1).toBe(oldIP)
    expect(ip2).toBe(newIP)
    expect(ip3).toBe(lclIP)
  })

  it("doesn't call setIP if ip unchanged", async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers({ ...headersMap, 'x-real-ip': oldIP }),
      body: JSON.stringify(payload),
    }
    // emulate calling API endpoint
    const response = await handleRequest(new Request('/', requestOptions))

    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getIP).toHaveBeenCalledWith(payload)
    expect(setIP).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('fails if no token', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headersMap),
      body: JSON.stringify({ ...payload }),
    }

    const response = await handleRequest(new Request('/', requestOptions))
    expect(response.status).toEqual(406)
    expect(getIP).not.toHaveBeenCalled()
    expect(setIP).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails if no zone_id', async () => {
    const payload = {
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headersMap),
      body: JSON.stringify({ ...payload }),
    }

    const response = await handleRequest(new Request('/', requestOptions))
    expect(response.status).toEqual(406)
    expect(getIP).not.toHaveBeenCalled()
    expect(setIP).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails if no dns record id', async () => {
    const payload = {
      zone_id: 'ZZZ',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headersMap),
      body: JSON.stringify({ ...payload }),
    }

    const response = await handleRequest(new Request('/', requestOptions))
    expect(response.status).toEqual(406)
    expect(getIP).not.toHaveBeenCalled()
    expect(setIP).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('changes dns if ip changed', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers({ ...headersMap, 'x-real-ip': newIP }),
      body: JSON.stringify(payload),
    }

    const response = await handleRequest(new Request('/', requestOptions))

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getIP).toHaveBeenCalledWith(payload)
    expect(setIP).toHaveBeenCalledWith(payload, newIP)

    const msg = await response.json()
    expect(msg).toMatchObject({ ip: newIP, success: true })
  })

  it('works with bearer token passed in header', async () => {
    const token = 'ABC'
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers({
        ...headersMap,
        'cf-connecting-ip': newIP,
        authorization: `Bearer ${token}`,
      }),
      body: JSON.stringify(payload),
    }

    const getIP = jest.spyOn(dns, 'getIP')
    const setIP = jest.spyOn(dns, 'setIP')

    const response = await handleRequest(new Request('/', requestOptions))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getIP).toHaveBeenCalledWith({ ...payload, token })
    expect(setIP).toHaveBeenCalledWith({ ...payload, token }, newIP)

    const msg = await response.json()
    expect(msg).toMatchObject({ ip: newIP, success: true })
  })

  it('uses supplied ip if provided', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
      localIP: lclIP,
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers({ ...headersMap, 'cf-connecting-ip': newIP }),
      body: JSON.stringify(payload),
    }

    const responses = [
      JSON.parse(
        JSON.stringify({ ...sampleResponse, result: { content: oldIP } }),
      ),
      JSON.parse(
        JSON.stringify({ ...sampleResponse, result: { content: lclIP } }),
      ),
    ]
    const mockedResponses = responses.map((x) => JSON.stringify(x))
    fetchMock.resetMocks()
    fetchMock.mockResponses(...mockedResponses)

    const response = await handleRequest(new Request('/', requestOptions))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getIP).toHaveBeenCalledWith(
      expect.objectContaining({
        zone_id: expect.any(String),
        dns_record_id: expect.any(String),
        token: expect.any(String),
      }),
    )
    expect(setIP).toHaveBeenCalledWith(
      expect.objectContaining({
        zone_id: expect.any(String),
        dns_record_id: expect.any(String),
        token: expect.any(String),
      }),
      lclIP,
    )

    const msg = await response.json()
    expect(msg).toMatchObject({ ip: lclIP, success: true })
  })
})
