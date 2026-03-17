import { 
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from "@Stendhal/lib/src/Exceptions"
import { os } from '@orpc/server'
import store from "@Stendhal/lib/src/db/Store"
import { type User } from "@Stendhal/lib/src/db/types"
import { z } from "zod"
import {
  uuidValidation
} from "@Stendhal/lib/src/utils"

// user session expiry in seconds
export const user_session_exp = parseInt(process.env.USER_SESSION_EXP || '3600')

// set the user cookie in the response
export function setSessionCookie(context: any, sessionId: string, exp: number) {
  context.cookie.sessionId.set({
    value: sessionId,
    httpOnly: true,
    path: '/',
    maxAge: exp,
    secure: true,
    sameSite: process.env.ENV === 'development' ? 'None' : 'Lax',
  })
}

// base context available in all procedures
export interface BaseContext {
  cookie: Record<string, { value?: string }>
}

// public procedure without authentication
export const publicProcedure = os.$context<BaseContext>()

// authenticated procedure with user session
export const authedProcedure = publicProcedure.use(async ({ context, next }) => {
  // try to authenticate the user from session cookie
  const sessionId = context.cookie.sessionId?.value
  if (!sessionId) 
    throw new BadRequestException('No session cookie found')

  const result = uuidValidation.safeParse(sessionId)
  if (!result.success)
    throw new BadRequestException('Invalid session ID format')

  // get the user information from the session store
  const user = await store.getSession(sessionId) as User | null
  if (!user) 
    throw new UnauthorizedException('Session not found')

  // extend the user session expiry and set the cookie again
  await store.extendSession(sessionId, user_session_exp)
  setSessionCookie(context, sessionId, user_session_exp)

  return next({
    context: {
      user
    }
  })
})
// admin procedure, requires authenticated user with admin role
export const adminProcedure = authedProcedure.use(async ({ context, next }) => {
  if (!context.user.admin)
    throw new ForbiddenException('Admin access required')

  return next({ context })
})

// helper function to check if the user is the owner of the resource or an admin
export function assertOwnerOrAdmin(
  context: { user: User }, 
  resourceOwnerId: string, 
  message = 'You are not authorized to perform this action'): void {
  if (context.user.id != resourceOwnerId && !context.user.admin) 
    throw new ForbiddenException(message)
}