import figlet from "figlet"
import { Elysia } from "elysia"
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { OpenAPIGenerator } from '@orpc/openapi'
import { z } from "zod"
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ContentTooLargeException
} from "@Stendhal/lib/src/Exceptions"
import { rpcHandler } from "./src/orpc/RPCHandler"
import { router } from "./src/orpc/Router"
import { fileRoutes } from "./src/rest/index"

const PORT = 9000
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(4 * 1024 * 1024 * 1024)) // 4GB default

const domain = process.env.DOMAIN || 'localhost'

console.log(figlet.textSync("Backend"))
console.log(`Backend is running in ${process.env.ENV}`)

const app = new Elysia({ prefix: '/api' })

// Enable OpenAPI only in development
if (process.env.ENV === 'development'){
  app
    .use(openapi({ path: '/openapi' }))
    .get('/rpc/openapi.json', () => {
      return new OpenAPIGenerator({
        schemaConverters: [],
      }).generate(router, {
        info: {
          title: 'Stendhal API',
          version: '1.0.0',
          description: 'Stendhal Backend API powered by oRPC',
        },
        servers: [{ url: `https://localhost:8443/api/rpc`,}],
      })
    })
    .get('/rpc/openapi', ({ set }) => {
      set.headers['content-type'] = 'text/html'
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Stendhal API - Documentation</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
              <script id="api-reference" data-url="/api/rpc/openapi.json"></script>
              <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
            </body>
          </html>`
    })
}

app
  //.onRequest(() => console.log('hits backend'))
  .use(cors({ 
    origin: process.env.ENV === 'development' ? ['*'] : [`https://${domain}`], 
    credentials: true
  }))
  .error({ 
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    ContentTooLargeException
  })
  .onError(({ code, error, status }) => {
    if (code === 'UNKNOWN')
      code = 'INTERNAL_SERVER_ERROR'

    const statusCode = (error as any).status || 500
    const message = (error as any).message || 'Internal Server Error'
    
    return status(statusCode, { 
      name: code, 
      message,
      status: statusCode
    })
  })

  .post('/rpc*', async ({ request, cookie }: { request: Request, cookie: any }) => {
    const { response } = await rpcHandler.handle(request, {
      prefix: '/api/rpc',
      context: {
        cookie
      }
    })

    return response ?? new Response('Not Found', { status: 404 })
  }, 
  {
    parse: 'none' // Disable Elysia body parser to prevent "body already used" error
  })
  .use(fileRoutes)
  .listen({
    port: PORT,
    maxRequestBodySize: MAX_FILE_SIZE
  })