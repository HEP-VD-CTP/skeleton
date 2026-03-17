import { SQL } from 'bun'
import { Kysely } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import { 
  type Database 
} from './types.ts'

import User from './User.ts'
import File from './File.ts'

const sql = new SQL({
  database: process.env.POSTGRES_DB || 'skeleton',
  host: 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'skeleton',
  password: process.env.POSTGRES_PASSWORD || '123456',
  max: 10,
})

export const db = new Kysely<Database>({
  dialect: new PostgresJSDialect({
    postgres: sql
  })
})

export const dao = {
  user: User,
  file: File,
} 

export default {
  db,
  dao
}
