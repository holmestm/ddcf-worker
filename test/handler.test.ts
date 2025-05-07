import { handleRequest } from '../src/handler'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as dns from '../src/dns'
import makeServiceWorkerEnv from 'service-worker-mock'

// Setup fetch mock
const fetchMock = vi.hoisted(() => ({
  mockResponses: (...responses: string[]) => {
    let callCount = 0
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const response = responses[callCount] || responses[responses.length - 1]
      callCount = Math.min(callCount + 1, responses.length - 1)
      return Promise.resolve(new Response(response))
    })
  },
  resetMocks: () => {
    globalThis.fetch = vi.fn()
  }
}))

// Mock DNS functions
vi.mock('../src/dns', async (importOriginal) => {
  const actual = await importOriginal() as { getIP: (payload: unknown) => Promise<{ ip: string, success: boolean }>, setIP: (payload: unknown, ip: string) => Promise<{ success: boolean }> }
  return {
    ...actual,
    getIP: vi.spyOn(actual, 'getIP'),
    setIP: vi.spyOn(actual, 'setIP'),
  }
})

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

describe('handle', () => {
  beforeEach(() => {
    Object.assign(globalThis, makeServiceWorkerEnv())
    vi.resetModules()
    fetchMock.resetMocks()
    fetchMock.mockResponses(...mockedResponses)
  })

  afterEach(() => {
    vi.mocked(dns.getIP).mockClear()
    vi.mocked(dns.setIP).mockClear()
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
    expect(dns.getIP).toHaveBeenCalledWith(payload)
    expect(dns.setIP).not.toHaveBeenCalled()
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
    expect(dns.getIP).not.toHaveBeenCalled()
    expect(dns.setIP).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
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
    expect(dns.getIP).not.toHaveBeenCalled()
    expect(dns.setIP).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
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
    expect(dns.getIP).not.toHaveBeenCalled()
    expect(dns.setIP).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
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
    expect(dns.getIP).toHaveBeenCalledWith(payload)
    expect(dns.setIP).toHaveBeenCalledWith(payload, newIP)

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

    const response = await handleRequest(new Request('/', requestOptions))

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(dns.getIP).toHaveBeenCalledWith({ ...payload, token })
    expect(dns.setIP).toHaveBeenCalledWith({ ...payload, token }, newIP)

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

    const customResponses = [
      JSON.parse(
        JSON.stringify({ ...sampleResponse, result: { content: oldIP } }),
      ),
      JSON.parse(
        JSON.stringify({ ...sampleResponse, result: { content: lclIP } }),
      ),
    ]
    const customMockedResponses = customResponses.map((x) => JSON.stringify(x))
    fetchMock.resetMocks()
    fetchMock.mockResponses(...customMockedResponses)

    const response = await handleRequest(new Request('/', requestOptions))

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(dns.getIP).toHaveBeenCalledWith(
      expect.objectContaining({
        zone_id: expect.any(String),
        dns_record_id: expect.any(String),
        token: expect.any(String),
      }),
    )
    expect(dns.setIP).toHaveBeenCalledWith(
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