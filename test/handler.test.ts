import { handleRequest } from '../src/handler'
import fm, {
  enableFetchMocks,
  disableFetchMocks,
  MockResponseInit,
  MockParams,
  MockResponseInitFunction,
} from 'jest-fetch-mock'
import * as dns from '../src/dns'
import makeServiceWorkerEnv from 'service-worker-mock'

enableFetchMocks()

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

const { success, errors, messages, result } = sampleResponse

const mockedResponses: Array<[string, MockParams]> = [
  { success, errors, messages, result: { ...result, content: oldIP } },
  { success, errors, messages, result: { ...result, content: newIP } },
].map((x) => [JSON.stringify(x), { status: 200 }])

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
    fetchMock.resetMocks()
  })

  const headerDict = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-real-ip': '',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  it('fails if incomplete payload', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify({ ...payload }),
    }

    const response = await handleRequest(new Request('/', requestOptions))
    expect(response.status).toEqual(406)
  })

  it("doesn't set dns if ip unchanged", async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    headerDict['x-real-ip'] = oldIP
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify(payload),
    }
    // emulate calling API endpoint
    fetchMock.mockResponses(...mockedResponses)
    const getSpy = jest.spyOn(dns, 'getIP')
    const setSpy = jest.spyOn(dns, 'setIP')
    const response = await handleRequest(new Request('/', requestOptions))

    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getSpy).toHaveBeenCalledWith(payload)
    expect(setSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
  })

  it('changes dns if ip changed', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    headerDict['x-real-ip'] = newIP
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify(payload),
    }

    fetchMock.mockResponses(...mockedResponses)

    const getSpy = jest.spyOn(dns, 'getIP')
    const setSpy = jest.spyOn(dns, 'setIP')

    const response = await handleRequest(new Request('/', requestOptions))

    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getSpy).toHaveBeenCalled()
    expect(getSpy).toHaveBeenCalledWith(payload)
    expect(setSpy).toHaveBeenCalled()
    expect(setSpy).toHaveBeenCalledWith(payload, newIP)

    const msg = await response.json()
    expect(msg).toMatchObject({ ip: newIP, success: true })

    getSpy.mockRestore()
  })
})
