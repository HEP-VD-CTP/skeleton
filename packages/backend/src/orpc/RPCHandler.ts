import { RPCHandler,  } from '@orpc/server/fetch'
import { 
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ContentTooLargeException
} from "@Stendhal/lib/src/Exceptions"
import { 
  onError,
  ORPCError
} from '@orpc/server'

import { router } from "./Router.ts"

export const rpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      if (error instanceof BadRequestException) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        })
      }
      if (error instanceof UnauthorizedException) {
        throw new ORPCError('UNAUTHORIZED', {
          message: error.message
        })
      }
      if (error instanceof ForbiddenException) {
        throw new ORPCError('FORBIDDEN', {
          message: error.message
        })
      }
      if (error instanceof NotFoundException) { 
        throw new ORPCError('NOT_FOUND', {
          message: error.message
        })
      }
      if (error instanceof ConflictException) {
        throw new ORPCError('CONFLICT', {
          message: error.message
        })
      }
      if (error instanceof ContentTooLargeException) {
        throw new ORPCError('CONTENT_TOO_LARGE', {
          message: error.message
        })
      }

      // any instance of Error
      if (error instanceof Error) {
        const code = (error as any).code || 'INTERNAL_SERVER_ERROR'
        const message = error.message || 'An unexpected error occurred'
        throw new ORPCError(code, {
          message: message
        })
      }
      
      // for unknown errors return a generic message
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `An unexpected and unknown error occurred: ${error}`
      })
    }),
  ],
})

 