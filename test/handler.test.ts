import { handleRequest } from '../src/handler'
import * as dns from '../src/dns'
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

  test('fail if incomplete payload', async () => {
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
    expect(response.status).toEqual(406);
  })

  test('handle POST - ip unchanged', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify(payload),
    }

    const getSpy = jest.spyOn(dns, 'getIP').mockImplementation( jest.fn((args) => Promise.resolve({ ip: '1.2.3.4', success: true }) ) as jest.Mock )
    const setSpy = jest.spyOn(dns, 'setIP')
    const response = await handleRequest(new Request('/', requestOptions))
    
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getSpy).toHaveBeenCalled()
    expect(getSpy).lastCalledWith(payload);
    expect(setSpy).not.toHaveBeenCalled();

    getSpy.mockReset();
    getSpy.mockRestore();
  })

  test('handle POST - ip changed', async () => {
    const payload = {
      zone_id: 'ZZZ',
      dns_record_id: 'XXX',
      token: 'ABC',
    }
    const requestOptions = {
      method: 'POST',
      headers: new Headers(headerDict),
      body: JSON.stringify(payload),
    }

    const oldState = { ip: '1.2.3.5', success: true };
    const newState = { ip: '1.2.3.4', success: true }

    const getSpy = jest.spyOn(dns, 'getIP').mockImplementation( jest.fn((args) => Promise.resolve(oldState) ) as jest.Mock )
    const setSpy = jest.spyOn(dns, 'setIP').mockImplementation( jest.fn((args) => Promise.resolve(newState) ) as jest.Mock )
    const response = await handleRequest(new Request('/', requestOptions))
    
    expect(response.status).toEqual(200)
    expect(response.headers.get('content-type')).toEqual('application/json')
    expect(getSpy).toHaveBeenCalled();
    expect(getSpy).lastCalledWith(payload);
    expect(setSpy).toHaveBeenCalled();
    expect(setSpy).lastCalledWith(payload, '1.2.3.4');

    const msg = await response.json();
    expect(msg).toStrictEqual(newState);

    getSpy.mockReset();
    getSpy.mockRestore();
  })  
})
