// UUIDv7 generator - RFC 9562 compliant
const HEX = '0123456789abcdef'

export function uuidv7(): string {
  const timestamp = Date.now()
  const rand = crypto.getRandomValues(new Uint8Array(10))
  
  // 48-bit timestamp (big-endian)
  const b0 = Math.floor(timestamp / 0x10000000000) % 256
  const b1 = Math.floor(timestamp / 0x100000000) % 256
  const b2 = Math.floor(timestamp / 0x1000000) % 256
  const b3 = Math.floor(timestamp / 0x10000) % 256
  const b4 = Math.floor(timestamp / 0x100) % 256
  const b5 = timestamp % 256
  const b6 = 0x70 | (rand[0]! & 0x0f)   // version 7 + 4 random bits
  const b7 = rand[1]!                   // 8 random bits
  const b8 = 0x80 | (rand[2]! & 0x3f)   // variant 10 + 6 random bits
  
  return (
    HEX[b0 >> 4]! + HEX[b0 & 0xf]! +
    HEX[b1 >> 4]! + HEX[b1 & 0xf]! +
    HEX[b2 >> 4]! + HEX[b2 & 0xf]! +
    HEX[b3 >> 4]! + HEX[b3 & 0xf]! + '-' +
    HEX[b4 >> 4]! + HEX[b4 & 0xf]! +
    HEX[b5 >> 4]! + HEX[b5 & 0xf]! + '-' +
    HEX[b6 >> 4]! + HEX[b6 & 0xf]! +
    HEX[b7 >> 4]! + HEX[b7 & 0xf]! + '-' +
    HEX[b8 >> 4]! + HEX[b8 & 0xf]! +
    HEX[rand[3]! >> 4]! + HEX[rand[3]! & 0xf]! + '-' +
    HEX[rand[4]! >> 4]! + HEX[rand[4]! & 0xf]! +
    HEX[rand[5]! >> 4]! + HEX[rand[5]! & 0xf]! +
    HEX[rand[6]! >> 4]! + HEX[rand[6]! & 0xf]! +
    HEX[rand[7]! >> 4]! + HEX[rand[7]! & 0xf]! +
    HEX[rand[8]! >> 4]! + HEX[rand[8]! & 0xf]! +
    HEX[rand[9]! >> 4]! + HEX[rand[9]! & 0xf]!
  )
}


export default {
  uuidv7
}