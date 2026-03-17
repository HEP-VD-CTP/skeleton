import type {
  NewFile,
  UpdateFile,
  File
} from './types.ts'
import {
  NotFoundException,
} from "../Exceptions"

import { db } from './DB.ts'

// PostgreSQL BIGINT is returned as string by the driver — coerce to number
function coerceFile(file: File): File {
  return { ...file, size: Number(file.size) }
}

async function create(file: NewFile): Promise<File> {
  const result = await db
    .insertInto('file')
    .values(file)
    .returningAll()
    .executeTakeFirstOrThrow()
  return coerceFile(result)
}

async function getById(id: string): Promise<File> {
  const file = await db
    .selectFrom('file')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!file)
    throw new NotFoundException('File not found')

  return coerceFile(file)
}

async function getByUserId(userId: string): Promise<File[]> {
  const files = await db
    .selectFrom('file')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .execute()
  return files.map(coerceFile)
}

async function update(id: string, data: UpdateFile): Promise<File> {
  const file = await db
    .updateTable('file')
    .set(data)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()

  if (!file)
    throw new NotFoundException('File not found')

  return coerceFile(file)
}

async function updateLastAccess(id: string): Promise<void> {
  const result = await db
    .updateTable('file')
    .set({ last_access: new Date() })
    .where('id', '=', id)
    .where('last_access', '<', new Date())
    .executeTakeFirst()

  if (!result.numUpdatedRows)
    throw new NotFoundException('File not found')
}

async function remove(id: string): Promise<void> {
  const result = await db
    .deleteFrom('file')
    .where('id', '=', id)
    .executeTakeFirst()

  if (!result.numDeletedRows)
    throw new NotFoundException('File not found')
}

export default {
  create,
  getById,
  getByUserId,
  update,
  updateLastAccess,
  remove
}
