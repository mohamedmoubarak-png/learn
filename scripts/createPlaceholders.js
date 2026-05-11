import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { deflateSync } from 'node:zlib'

const width = 960
const height = 600

const supabaseFiles = [
  '01-supabase-signup.png',
  '02-supabase-dashboard.png',
  '03-supabase-create-table.png',
  '04-supabase-rls-policy.png',
  '05-supabase-api-keys.png',
  '06-supabase-crud-example.png',
  '07-supabase-auth-providers.png',
  '08-supabase-realtime.png',
  '09-supabase-storage.png',
  '10-supabase-edge-functions.png',
]

const firebaseFiles = [
  '01-firebase-create-project.png',
  '02-firebase-console.png',
  '03-firebase-firestore-create.png',
  '04-firebase-firestore-structure.png',
  '05-firebase-security-rules.png',
  '06-firebase-config-keys.png',
  '07-firebase-firestore-data.png',
  '08-firebase-auth-providers.png',
  '09-firebase-realtime-listener.png',
  '10-firebase-cloud-functions.png',
]

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

const crc32 = (buffer) => {
  let c = 0xffffffff
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const makePng = (primary, secondary, index) => {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const rowSize = width * 3 + 1
  const raw = Buffer.alloc(rowSize * height)

  for (let y = 0; y < height; y += 1) {
    const row = y * rowSize
    raw[row] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 3
      const inPanel = x > 90 && x < width - 90 && y > 86 && y < height - 86
      const inHeader = inPanel && y < 156
      const inBar = inPanel && x < 170 + index * 52 && y > 250 && y < 284
      const grid = x % 48 === 0 || y % 48 === 0
      const color = inBar ? secondary : inHeader ? primary : inPanel ? [16, 24, 45] : [5, 8, 22]
      raw[offset] = Math.min(color[0] + (grid ? 10 : 0), 255)
      raw[offset + 1] = Math.min(color[1] + (grid ? 10 : 0), 255)
      raw[offset + 2] = Math.min(color[2] + (grid ? 16 : 0), 255)
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const writeSet = (basePath, files, primary, secondary) => {
  mkdirSync(dirname(join(basePath, files[0])), { recursive: true })
  files.forEach((file, index) => {
    writeFileSync(join(basePath, file), makePng(primary, secondary, index + 1))
  })
}

writeSet('public/screenshots/supabase', supabaseFiles, [6, 182, 212], [124, 58, 237])
writeSet('public/screenshots/firebase', firebaseFiles, [124, 58, 237], [6, 182, 212])
