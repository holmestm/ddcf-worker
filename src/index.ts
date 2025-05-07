import { handleRequest } from './handler'

export default {
  async fetch(request): Promise<Response> {
    // Handle the request using the handleRequest function
    return handleRequest(request)
  },
} satisfies ExportedHandler;
