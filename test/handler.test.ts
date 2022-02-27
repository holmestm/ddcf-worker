import { handleRequest } from '../src/handler'
import { getIP, setIP } from '../src/dns'
import makeServiceWorkerEnv from 'service-worker-mock'

declare var global: any

import nodeFetch from 'node-fetch'
// Mocking fetch Web API using node-fetch
if (typeof fetch === 'undefined') {
  global.fetch = nodeFetch
  //global.Request = nodeFetch.Request
}

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  const headerDict = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-real-ip': '1.2.3.4',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  test('handle POST', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify({ ...payload }),
    }

    const result = await handleRequest(new Request('/', requestOptions))
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual('application/json')
    const response: Object = await result.json()
  })
})
