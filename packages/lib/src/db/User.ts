import { sql } from 'kysely'
import type { 
  NewUser, 
  UpdateUser, 
  User 
} from './types.ts'
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from "../Exceptions"
import {
  emailValidation,
  nameValidation,
  passwordValidation,
  uuidValidation
} from "../utils"

import { db } from './DB.ts'

export async function login(email: string, password: string): Promise<User> {
  // validate password is not empty
  if (!passwordValidation.safeParse(password).success)
    throw new BadRequestException('Password cannot be empty')

  const user = await db.selectFrom('users')
    .select(['id', 'firstname', 'lastname', 'email', 'pwd', 'teacher', 'admin', 'blocked', 'created_at', 'archived', 'last_activity'])
    .where('email', '=', email)
    .where('archived', '=', false)
    .executeTakeFirst()
    
  if(!user)
    throw new NotFoundException('User not found')

  if (user.blocked)
    throw new ForbiddenException('User is blocked')

  if (!(await Bun.password.verify(password, user.pwd!)))
    throw new UnauthorizedException('Invalid credentials')
 
  delete user.pwd
  delete user.blocked
  
  return user
}

export async function create(newUser: NewUser): Promise<void> {
  if (!emailValidation.safeParse(newUser.email).success)
    throw new BadRequestException('Invalid email format')  
  if (!passwordValidation.safeParse(newUser.pwd).success)
    throw new BadRequestException('Password cannot be empty')

  await db.transaction().execute(async (trx) => {
    // check if the user exists and is not archived
    const existingUser = await trx.selectFrom('users')
      .select(['id'])
      .where('email', '=', newUser.email)
      .where('archived', '=', false)
      .executeTakeFirst()

    if (existingUser)
      throw new ConflictException('User with this email already exists and is not archived')

    // hash the password and create the user
    newUser.pwd = await Bun.password.hash(newUser.pwd!)
    await trx.insertInto('users')
      .values(newUser)
      .execute()
  })
}

async function getById(id: string): Promise<User> {
  const user = await db
    .selectFrom('users')
    .select(['id', 'firstname', 'lastname', 'email', 'pwd', 'teacher', 'admin', 'blocked', 'created_at', 'archived', 'last_activity'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user)
    throw new NotFoundException('User not found')

  return user
}

async function update(id: string, data: UpdateUser): Promise<User> {
  if (data.pwd)
    data.pwd = await Bun.password.hash(data.pwd)

  const user = await db
    .updateTable('users')
    .set(data)
    .where('id', '=', id)
    .returning(['id', 'firstname', 'lastname', 'email', 'pwd', 'teacher', 'admin', 'blocked', 'created_at', 'archived', 'last_activity'])
    .executeTakeFirst()

  if (!user)
    throw new NotFoundException('User not found')

  return user
}

async function archive(id: string, archived: boolean): Promise<void> {
  const result = await db
    .updateTable('users')
    .set({ archived })
    .where('id', '=', id)
    .executeTakeFirst()

  if (!result.numUpdatedRows)
    throw new NotFoundException('User not found')
}

async function search(query: string): Promise<User[]> {
  return await db
    .selectFrom('users')
    .select(['id', 'firstname', 'lastname', 'email', 'pwd', 'teacher', 'admin', 'blocked', 'created_at', 'archived', 'last_activity'])
    .where('archived', '=', false)
    .where((eb) => {
      if (uuidValidation.safeParse(query).success)
        return eb.or([
          sql<boolean>`search_tsv @@ to_tsquery('simple', ${query + ':*'})`,
          eb('id', '=', query),
        ])
      return sql<boolean>`search_tsv @@ to_tsquery('simple', ${query + ':*'})`
    })
    .orderBy('created_at', 'desc')
    .execute()
}

async function getAll(): Promise<User[]> {
  return await db
    .selectFrom('users')
    .select(['id', 'firstname', 'lastname', 'email', 'pwd', 'teacher', 'admin', 'blocked', 'created_at', 'archived', 'last_activity'])
    .where('archived', '=', false)
    .orderBy('created_at', 'desc')
    .execute()
} 

export default {
  login,
  getById,
  update,
  archive,
  search,
  create,
  getAll
}
