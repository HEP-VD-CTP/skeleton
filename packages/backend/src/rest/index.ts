import { Elysia } from "elysia"
import { mkdir, rm } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileTypeFromBuffer } from 'file-type'
import mime from 'mime'
import { z } from "zod"
import store from '@Stendhal/lib/src/db/Store'
import {
  BadRequestException,
  UnauthorizedException,
  ContentTooLargeException
} from "@Stendhal/lib/src/Exceptions"
import { assertOwnerOrAdmin } from "../orpc/RPCUtils"
import lib from '@Stendhal/lib'
import { dao } from "@Stendhal/lib/src/db/DB"
import { uuidValidation } from "@Stendhal/lib/src/utils"
import type { User } from "@Stendhal/lib/src/db/types"

const FILES_PATH = '/data/files'

// Code/text extensions that generic MIME libraries misidentify
// (e.g. .ts → video/mp2t instead of application/typescript)
const codeExtensions: Record<string, string> = {
  ts: 'application/typescript', mts: 'application/typescript', cts: 'application/typescript',
  tsx: 'application/typescript',
  js: 'application/javascript', mjs: 'application/javascript', cjs: 'application/javascript',
  jsx: 'application/javascript',
  vue: 'text/html',
  json: 'application/json', jsonc: 'application/json',
  md: 'text/markdown', mdx: 'text/markdown',
  yaml: 'text/yaml', yml: 'text/yaml',
  toml: 'text/plain',
  graphql: 'application/graphql', gql: 'application/graphql',
  py: 'text/x-python', pyw: 'text/x-python',
  rb: 'text/x-ruby',
  rs: 'text/x-rust',
  go: 'text/x-go',
  java: 'text/x-java',
  kt: 'text/x-kotlin', kts: 'text/x-kotlin',
  scala: 'text/x-scala',
  swift: 'text/x-swift',
  c: 'text/x-c', h: 'text/x-c',
  cpp: 'text/x-c++', cxx: 'text/x-c++', cc: 'text/x-c++', hpp: 'text/x-c++',
  cs: 'text/x-csharp',
  r: 'text/x-r',
  lua: 'text/x-lua',
  pl: 'text/x-perl', perl: 'text/x-perl',
  sh: 'application/x-sh', bash: 'application/x-sh', zsh: 'application/x-sh',
  sql: 'application/sql',
  dockerfile: 'text/x-dockerfile',
  env: 'text/plain', ini: 'text/plain', conf: 'text/plain', cfg: 'text/plain',
  csv: 'text/csv', tsv: 'text/tab-separated-values',
  txt: 'text/plain', log: 'text/plain',
}

export const fileRoutes = new Elysia()

  // upload a file
  .post('/files', async ({ request, cookie }) => {
    const sessionId = cookie.sessionId?.value as string | undefined
    if (!sessionId)
      throw new UnauthorizedException('No session cookie found')

    const user = await store.getSession(sessionId) as User | null
    if (!user)
      throw new UnauthorizedException('Session not found')

    const fileId = lib.utils.uuidv7()

    const rawFilename = request.headers.get('x-filename')
    if (!rawFilename)
      throw new BadRequestException('Missing X-Filename header')

    const filename = lib.utils.sanitizeFilename(basename(decodeURIComponent(rawFilename)))

    if (!request.body)
      throw new BadRequestException('Request body is empty')

    // create sharded upload path: {FILES_PATH}/{l1}/{l2}/{l3}/{fileId}
    const filePath = lib.utils.fileShardPath(FILES_PATH, fileId)
    const fileDir = filePath.substring(0, filePath.lastIndexOf('/'))
    await mkdir(fileDir, { recursive: true })

    // Pipe request stream to disk
    try {
      await pipeline(
        Readable.fromWeb(request.body as any),
        createWriteStream(filePath)
      )
    }
    catch (err) {
      await rm(filePath, { force: true })
      throw new ContentTooLargeException('Failed to save file')
    }

    const file = Bun.file(filePath)
    const size = file.size

    // Detect MIME type: code extension → magic bytes → generic extension → client header → fallback
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const codeMime = codeExtensions[ext] || null
    const headerMime = request.headers.get('content-type') || null
    const magicSample = await file.slice(0, 4096).arrayBuffer()
    const detected = await fileTypeFromBuffer(magicSample)
    const mimeType = codeMime
      ?? detected?.mime
      ?? mime.getType(filename)
      ?? headerMime
      ?? 'application/octet-stream'

    // Compute SHA-256 via native sha256sum
    const proc = Bun.spawn(['sha256sum', '--', filePath], { stdout: 'pipe' })
    const output = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    if (exitCode !== 0)
      throw new ContentTooLargeException(`sha256sum failed with exit code ${exitCode}`)
    const checksum = output.split(' ')[0]!

    // Save file metadata to database
    await dao.file.create({
      id: fileId,
      user_id: user.id,
      filename,
      mime_type: mimeType,
      size,
      checksum,
      created_at: new Date(),
      last_access: new Date(),
    })

    console.log(`\n=== File uploaded ===\nUser: ${user.email}\nFile: ${fileId}/${filename} (${mimeType}, ${size} bytes)`)

    return { fileId, filename, mimeType, size, checksum }
  }, {
    parse: 'none',
  })

  // download a file
  .get('/files/:fileId', async ({ params, cookie }) => {
    const sessionId = cookie.sessionId?.value as string | undefined
    if (!sessionId)
      throw new UnauthorizedException('No session cookie found')

    const user = await store.getSession(sessionId) as User | null
    if (!user)
      throw new UnauthorizedException('Session not found')

    const meta = await dao.file.getById(params.fileId)
    assertOwnerOrAdmin({ user }, meta.user_id, 'You are not authorized to download this file')

    const contentType = meta.mime_type || 'application/octet-stream'
    const filename = (meta.filename || params.fileId).replace(/"/g, '')

    // RFC 5987 encoding for non-ASCII filenames
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())

    // Inline for browser-renderable types, attachment for the rest
    // SVG excluded from inline to prevent XSS
    const inlineTypes = /^(video|audio)\//
    const inlineMimes = ['application/pdf']
    const isImage = /^image\//.test(contentType) && contentType !== 'image/svg+xml'
    const disposition = inlineTypes.test(contentType) || inlineMimes.includes(contentType) || isImage ? 'inline' : 'attachment'

    // X-Accel-Redirect: nginx serves the file directly from disk
    const accelPath = lib.utils.fileShardPath('/internal-files', params.fileId)

    // Update last access time asynchronously
    dao.file.updateLastAccess(params.fileId).catch(err => {
      console.error(`Failed to update access time for file ${params.fileId}:`, err)
    })

    return new Response(null, {
      status: 200,
      headers: {
        'X-Accel-Redirect': accelPath,
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'X-Content-Type-Options': 'nosniff',
      }
    })
  }, {
    params: z.object({ fileId: uuidValidation })
  }) 
  