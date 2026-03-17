import { 
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from "@Stendhal/lib/src/Exceptions"
import { z } from "zod"

import { dao } from "@Stendhal/lib/src/db/DB"
import type {  
  User,
} from "@Stendhal/lib/src/db/types"
import store from "@Stendhal/lib/src/db/Store"

import {
  publicProcedure,
  authedProcedure,
  adminProcedure,
  user_session_exp,
  setSessionCookie,
  assertOwnerOrAdmin
} from "./RPCUtils.ts"
import {
  uuidValidation,
  emailValidation,
  passwordValidation,
  nameValidation,
  descriptionValidation
} from "@Stendhal/lib/src/utils"
import lib from "@Stendhal/lib"
import fs from 'node:fs/promises'


/*
.handler(async ({ input, context, path, procedure, signal }) => {
  input:	Validated input type	The validated input data from your .input() schema
  context:	TCurrentContext	The procedure context (from middleware or base procedure)
  path:	readonly string[]	The procedure path (e.g., ['auth', 'login'])
  procedure:	Procedure	The procedure definition itself
  signal:	AbortSignal | undefined	For handling request cancellation
  errors:	ORPCErrorConstructorMap	Error constructors based on your error map
  lastEventId:	string \| undefined	For Server-Sent Events (SSE) / streaming support
})
*/

const FILES_PATH = '/data/files'

export const router = {
  auth: { 
    // user login
    login: publicProcedure
      .input(z.object({
        email: emailValidation,
        password: passwordValidation,
      }))
      .handler(async ({ input, context }) => {
        const oldSessionId = context.cookie.sessionId?.value
        if (oldSessionId)
          await store.deleteSession(oldSessionId)

        const user = await dao.user.login(input.email, input.password)

        const sessionId = Bun.randomUUIDv7()
        await store.createSession(sessionId, user, user_session_exp)
        setSessionCookie(context, sessionId, user_session_exp)

        return user
      }),

    // extend user session
    renew: authedProcedure
      .handler(async ({ context }) => {
        return context.user
      }),

    // delete user session
    logout: authedProcedure
      .handler(async ({ context }) => {
        const sessionId = context.cookie.sessionId?.value
        if (sessionId) {
          await store.deleteSession(sessionId)
          setSessionCookie(context, '', 0)
        }
        return true
      }),

    // update user password
    changePassword: authedProcedure
      .input(z.object({
        userId: uuidValidation,
        newPassword: passwordValidation,
      }))
      .handler(async ({ input, context }) => {
        assertOwnerOrAdmin(context, input.userId)
        await dao.user.update(input.userId, { pwd: input.newPassword })
      }),
  },

  file: {
    list: authedProcedure
      .input(z.object({ userId: uuidValidation }))
      .handler(async ({ input, context }) => {
        assertOwnerOrAdmin(context, input.userId)
        return await dao.file.getByUserId(input.userId)
      }),

    remove: authedProcedure
      .input(z.object({ fileId: uuidValidation }))
      .handler(async ({ input, context }) => {
        const file = await dao.file.getById(input.fileId)
        assertOwnerOrAdmin(context, file.user_id)

        const filePath = lib.utils.fileShardPath(FILES_PATH, input.fileId)
        await fs.rm(filePath, { force: true })

        await dao.file.remove(input.fileId)
      }),
  },

  admin: {
    users: {
      search: adminProcedure
        .input(z.object({ query: z.string().min(1).max(255) }))
        .handler(async ({ input }) => {
          if (input.query === '*')
            return await dao.user.getAll()
          return await dao.user.search(input.query)
        }),

      getById: adminProcedure
        .input(z.object({ userId: uuidValidation }))
        .handler(async ({ input }) => {
          return await dao.user.getById(input.userId)
        }),

      create: adminProcedure
        .input(z.object({
          firstname: nameValidation,
          lastname: nameValidation,
          email: emailValidation,
          password: passwordValidation,
          teacher: z.boolean().default(false),
          admin: z.boolean().default(false),
        }))
        .handler(async ({ input }) => {
          await dao.user.create({
            id: Bun.randomUUIDv7(),
            email: input.email,
            firstname: input.firstname,
            lastname: input.lastname,
            pwd: input.password,
            teacher: input.teacher,
            admin: input.admin,
            archived: false,
            created_at: new Date(),
            last_activity: null,
          })
        }),

      update: adminProcedure
        .input(z.object({
          userId: uuidValidation,
          data: z.object({
            firstname: nameValidation.optional(),
            lastname: nameValidation.optional(),
            email: emailValidation.optional(),
            teacher: z.boolean().optional(),
            admin: z.boolean().optional(),
            blocked: z.boolean().optional(),
            archived: z.boolean().optional(),
          }),
        }))
        .handler(async ({ input }) => {
          return await dao.user.update(input.userId, input.data)
        }),
    },
  },
} as const