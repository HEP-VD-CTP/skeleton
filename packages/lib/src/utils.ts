import { z } from "zod"


export function uuidv7(): string {
  return Bun.randomUUIDv7()
}

export function sanitizeFilename(raw: string): string {
  const result = raw
    .normalize('NFKD')
    .slice(0, 255)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/\?<>\\:*|"]/g, '-')
    .replace(/^\.+$/, '-')
    .replace(/^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i, '-')
    .replace(/[. ]+$/, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  return result || 'unknown'
}
/**
 * Build a sharded file path from a fileId using the last 6 hex characters.
 * E.g. fileId "019cb37f-f80e-7000-8463-b7224093c477" → "c4/77/" 
 * Combined with a base path: "{basePath}/c4/77/{fileId}"
 */
export function fileShardPath(basePath: string, fileId: string): string {
  const hex = fileId.replace(/-/g, '')
  const l1 = hex.slice(-6, -4) // 3rd-to-last pair
  const l2 = hex.slice(-4, -2) // 2nd-to-last pair
  const l3 = hex.slice(-2)     // last pair
  return `${basePath}/${l1}/${l2}/${l3}/${fileId}`
}
/*
 * Validation schemas 
 */
export const nameValidation = z.string().min(1).max(255)
export const passwordValidation = z.string().min(6).max(255)
export const emailValidation = z.email().max(255)
export const uuidValidation = z.uuid({version: 'v7'})
export const descriptionValidation = z.string().max(65535)

export default {
  uuidv7,
  sanitizeFilename,
  fileShardPath,
  nameValidation,
  passwordValidation,
  emailValidation,
  uuidValidation,
  descriptionValidation
}