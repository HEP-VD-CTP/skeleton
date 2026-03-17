import { RedisClient } from "bun"
import { type User } from "./types.ts"

const redis = new RedisClient(`redis://redis:6379`)

// Store a session in redis with a given expiry time, by default 1 day.
async function createSession(sessionId: string, sessionData: User, expSeconds: number = 86400): Promise<void> {
  const key = `session:${sessionId}`
  await redis.send('SET', [key, JSON.stringify(sessionData), 'EX', expSeconds.toString()])
}

async function getSession(sessionId: string): Promise<User | null> {
  const result = await redis.send('GET', [`session:${sessionId}`])
  return result ? JSON.parse(result as string) : null
}

async function extendSession(sessionId: string, expSeconds: number): Promise<boolean> {
  const result = await redis.send('EXPIRE', [`session:${sessionId}`, expSeconds.toString()])
  return result === 1
}

async function deleteSession(sessionId: string): Promise<number> {
  return await redis.send('DEL', [`session:${sessionId}`]) as number
}

async function set(key: string, value: any): Promise<void> {
  await redis.send('SET', [key, JSON.stringify(value)])
}

async function get(key: string): Promise<any> {
  const result = await redis.send('GET', [key])
  return result ? JSON.parse(result as string) : null
}

export default {
  createSession,
  getSession,
  extendSession,
  deleteSession,
  set,
  get
}