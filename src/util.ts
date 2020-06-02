import { randomBytes } from 'crypto'
import { privateKeyVerify, publicKeyConvert } from 'secp256k1'
import { debug as createDebugLogger } from 'debug'
import createKeccakHash from 'keccak'
import assert from 'assert'

const debug = createDebugLogger('devp2p:util')

export function keccak256(...buffers: Buffer[]) {
  const buffer = Buffer.concat(buffers)
  return createKeccakHash('keccak256')
    .update(buffer)
    .digest()
}

export function genPrivateKey() {
  while (true) {
    const privateKey = randomBytes(32)
    if (privateKeyVerify(privateKey)) return privateKey
  }
}

export function pk2id(pk: Buffer): Buffer {
  if (pk.length === 33) {
    pk = Buffer.from(publicKeyConvert(pk, false))
  }
  return pk.slice(1)
}

export function id2pk(id: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x04]), id])
}

export function int2buffer(v: number): Buffer {
  let hex = v.toString(16)
  if (hex.length % 2 === 1) hex = '0' + hex
  return Buffer.from(hex, 'hex')
}

export function buffer2int(buffer: Buffer): number {
  if (buffer.length === 0) return NaN

  let n = 0
  for (let i = 0; i < buffer.length; ++i) n = n * 256 + buffer[i]
  return n
}

export function zfill(buffer: Buffer, size: number, leftpad: boolean = true): Buffer {
  if (buffer.length >= size) return buffer
  if (leftpad === undefined) leftpad = true
  const pad = Buffer.allocUnsafe(size - buffer.length).fill(0x00)
  return leftpad ? Buffer.concat([pad, buffer]) : Buffer.concat([buffer, pad])
}

export function xor(a: Buffer, b: any): Buffer {
  const length = Math.min(a.length, b.length)
  const buffer = Buffer.allocUnsafe(length)
  for (let i = 0; i < length; ++i) buffer[i] = a[i] ^ b[i]
  return buffer
}

export function assertEq(expected: any, actual: any, msg: string): void {
  let message
  if (Buffer.isBuffer(expected) && Buffer.isBuffer(actual)) {
    if (expected.equals(actual)) return
    message = `${msg}: ${expected.toString('hex')} / ${actual.toString('hex')}`
    debug(message)
    throw new assert.AssertionError({
      message: message,
    })
  }

  if (expected === actual) return
  message = `${msg}: ${expected} / ${actual}`
  debug(message)
  throw new assert.AssertionError({
    message: message,
  })
}

export function formatLogId(id: string, verbose: boolean): string {
  const numChars = 7
  if (verbose) {
    return id
  } else {
    return `${id.substring(0, numChars)}`
  }
}

export function formatLogData(data: string, verbose: boolean): string {
  const maxChars = 60
  if (verbose || data.length <= maxChars) {
    return data
  } else {
    return `${data.substring(0, maxChars)}...`
  }
}

export class Deferred<T> {
  promise: Promise<T>
  resolve: (...args: any[]) => any = () => {}
  reject: (...args: any[]) => any = () => {}
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export function createDeferred<T>(): Deferred<T> {
  return new Deferred()
}
