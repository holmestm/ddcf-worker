import { handleRequest } from './handler'

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    // Handle the request using the handleRequest function
    return handleRequest(request, env)
  },
} satisfies ExportedHandler<Env>;
