
/*
 * Note for LLMs: 
 * This file defines the database schema and related types for the application. 
 * It includes interfaces for the User and File tables, as well as types for inserting and updating records. 
 * The Database interface represents the overall structure of the database.
 * Do not import the Generated type from Kysely directly, as it may cause issues with type inference in other parts of the application
 * Do not use Generated for defining the types of the tables, as it can lead to issues with type inference in other parts of the application.
 * Instead, define the table interfaces with explicit types for each field, and use Insertable and Updateable for the corresponding insert and update types.
 * This approach ensures better type safety and compatibility across the application.
 */
import type {
  Insertable,
  Updateable
} from 'kysely'

export interface UserTable {
  id: string
  email: string
  firstname: string
  lastname: string
  pwd?: string
  teacher: boolean
  admin: boolean
  archived: boolean
  blocked?: boolean
  created_at: Date
  last_activity: Date | null
}

export type User = UserTable
export type NewUser = Insertable<UserTable>
export type UpdateUser = Updateable<UserTable>

export interface FileTable {
  id: string
  user_id: string
  filename: string | null
  mime_type: string | null
  size: number
  checksum: string | null
  created_at: Date
  last_access: Date
}

export type File = FileTable
export type NewFile = Insertable<FileTable>
export type UpdateFile = Updateable<FileTable>


export interface Database {
  users: UserTable
  file: FileTable
}