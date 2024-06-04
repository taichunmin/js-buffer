import _ from 'lodash'
import { type Uint8Array } from './Uint8Array'

const customBufferSymbol = Symbol.for('taichunmin.buffer')
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')
const float16Buf = new DataView(new ArrayBuffer(4))
const INSPECT_MAX_BYTES = 50
const isNativeLittleEndian = new Uint8Array(new Uint16Array([0x1234]).buffer)[0] === 0x12
const K_MAX_LENGTH = 0x7FFFFFFF
const SIGNED_MAX_VALUE = [0, 0x7F, 0x7FFF, 0x7FFFFF, 0x7FFFFFFF, 0x7FFFFFFFFF, 0x7FFFFFFFFFFF]
const SIGNED_OFFSET = [0, 0x100, 0x10000, 0x1000000, 0x100000000, 0x10000000000, 0x1000000000000]

const CHARCODE_BASE64 = new Map() as unknown as CharCodeMap
initCharCodeMap(CHARCODE_BASE64, '-_', 62)
initCharCodeMap(CHARCODE_BASE64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')

const CHARCODE_BASE64URL = new Map() as unknown as CharCodeMap
initCharCodeMap(CHARCODE_BASE64URL, '+/', 62)
initCharCodeMap(CHARCODE_BASE64URL, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')

const CHARCODE_HEX = new Map() as unknown as CharCodeMap
initCharCodeMap(CHARCODE_HEX, 'ABCDEF', 10)
initCharCodeMap(CHARCODE_HEX, '0123456789abcdef')

const fromStringFns = {
  'ucs-2': 'fromUcs2String',
  'utf-16le': 'fromUcs2String',
  'utf-8': 'fromUtf8String',
  ascii: 'fromLatin1String',
  base64: 'fromBase64String',
  base64url: 'fromBase64urlString',
  binary: 'fromLatin1String',
  hex: 'fromHexString',
  latin1: 'fromLatin1String',
  ucs2: 'fromUcs2String',
  utf16le: 'fromUcs2String',
  utf8: 'fromUtf8String',
} as const

const toStringFns = {
  'ucs-2': 'toUcs2String',
  'utf-16le': 'toUcs2String',
  'utf-8': 'toUtf8String',
  ascii: 'toLatin1String',
  base64: 'toBase64String',
  base64url: 'toBase64urlString',
  binary: 'toLatin1String',
  hex: 'toHexString',
  latin1: 'toLatin1String',
  ucs2: 'toUcs2String',
  utf16le: 'toUcs2String',
  utf8: 'toUtf8String',
} as const

/**
 * @see [Format Characters](https://docs.python.org/3/library/struct.html#format-characters)
 */
const packFromFns = new Map<string, (ctx: PackFromContext) => void>([
  ['x', packFromPad],
  ['c', packFromChar],
  ['b', packFromInt8],
  ['B', packFromInt8],
  ['?', packFromBool],
  ['h', packFromInt16],
  ['H', packFromInt16],
  ['i', packFromInt32],
  ['I', packFromInt32],
  ['l', packFromInt32],
  ['L', packFromInt32],
  ['q', packFromBigInt64],
  ['Q', packFromBigInt64],
  ['e', packFromFloat16],
  ['f', packFromFloat],
  ['d', packFromDouble],
  ['s', packFromString],
  ['p', packFromPascal],
])

/**
 * @see [Format Characters](https://docs.python.org/3/library/struct.html#format-characters)
 */
const unpackToFns = new Map<string, (ctx: PackFromContext) => void>([
  ['x', unpackToPad],
  ['c', unpackToChar],
  ['b', unpackToInt8],
  ['B', unpackToInt8],
  ['?', unpackToBool],
  ['h', unpackToInt16],
  ['H', unpackToInt16],
  ['i', unpackToInt32],
  ['I', unpackToInt32],
  ['l', unpackToInt32],
  ['L', unpackToInt32],
  ['q', unpackToBigInt64],
  ['Q', unpackToBigInt64],
  ['e', unpackToFloat16],
  ['f', unpackToFloat],
  ['d', unpackToDouble],
  ['s', unpackToString],
  ['p', unpackToPascal],
])

/**
 * The `Buffer` class is a cross platform alternative of [Node buffer](https://nodejs.org/api/buffer.html#class-buffer) base on `UInt8Array`.
 * @see See the [Buffer | Node.js Documentation](https://nodejs.org/api/buffer.html#class-buffer) for more information.
 * @property buffer - The underlying `ArrayBuffer` object based on which this `Buffer` object is created.
 */
export class Buffer extends Uint8Array {
  readonly #dv: DataView

  /**
   * Creates a zero-length `Buffer`.
   */
  constructor ()

  /**
   * Creates a new `Buffer` with `length` bytes. The contents are initialized to `0`.
   * @param length - The desired length of the new `Buffer`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   console.log(buf.length) // Prints: 2
   * })()
   * ```
   */
  constructor (length: number)

  /**
   * Creates a new `Buffer` copied from `array`. `TypedArray` will be treated as an `Array`.
   * @param arrayLike - An array of bytes in the range `0` – `255`. Array entries outside that range will be truncated to fit into it.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = new Buffer([21, 31])
   *   console.log(buf1.toString('hex')) // Prints: 151f
   *
   *   const buf2 = new Buffer(new Uint16Array([0x1234, 0x5678]))
   *   console.log(buf2.toString('hex')) // Prints: 3478
   *
   *   const buf3 = Buffer.from('0102', 'hex')
   *   const buf4 = new Buffer(buf3)
   *   buf3[0] = 0x03
   *   console.log(buf3.toString('hex')) // Prints: 0302
   *   console.log(buf4.toString('hex')) // Prints: 0102
   * })()
   * ```
   */
  constructor (arrayLike: ArrayLike<number> | Iterable<number> | ArrayBufferView)

  /**
   * Creates a view of the `ArrayBuffer` without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a `TypedArray` instance, the newly created `Buffer` will share the same allocated memory as the `TypedArray`'s underlying `ArrayBuffer`.
   * @param arrayBuffer - An `ArrayBuffer` or `SharedArrayBuffer`, for example the `.buffer` property of a `TypedArray`.
   * @param byteOffset - Index of first byte to expose. Default: `0`.
   * @param length - Number of bytes to expose. Default: `arrayBuffer.byteLength - byteOffset`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const uint16 = new Uint16Array([5000, 4000])
   *   const buf = Buffer.from(uint16.buffer) // Shares memory with `uint16`.
   *   console.log(buf.toString('hex')) // Prints: 8813a00f
   *
   *   uint16[1] = 6000
   *   console.log(buf.toString('hex')) // Prints: 88137017
   * })()
   * ```
   */
  constructor (arrayBuffer: ArrayBufferLike, byteOffset?: number, length?: number)

  constructor (...args: any[]) {
    // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
    super(...args)
    this.#dv = new DataView(this.buffer, this.byteOffset, this.byteLength)
  }

  /**
   * Allocates a new `Buffer` of `size` bytes. If `fill` is `undefined`, the `Buffer` will be zero-filled.
   * @param size - The desired length of the new `Buffer`.
   * @param fill - A value to pre-fill the new `Buffer` with. Default: `0`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.alloc(5)
   *   console.log(buf.toString('hex')) // Prints: 0000000000
   * })()
   * ```
   */
  static alloc (size: number, fill?: Buffer | number | Uint8Array): Buffer

  /**
   * Allocates a new `Buffer` of `size` bytes. If `fill` is `undefined`, the `Buffer` will be zero-filled.
   * @param size - The desired length of the new `Buffer`.
   * @param fill - A value to pre-fill the new `Buffer` with. Default: `0`.
   * @param encoding - The encoding of `fill`. Default: `'utf8'`.
   * @group Static Methods
   * @example
   * If `fill` is specified, the allocated `Buffer` will be initialized by calling `buf.fill(fill)`.
   *
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.alloc(5, 'a')
   *   console.log(buf.toString('hex')) // Prints: 6161616161
   * })()
   * ```
   * @example
   * If both `fill` and `encoding` are specified, the allocated `Buffer` will be initialized by calling `buf.fill(fill, encoding)`.
   *
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64')
   *   console.log(buf.toString('hex')) // Prints: 68656c6c6f20776f726c64
   * })()
   * ```
   */
  static alloc (size: number, fill: string, encoding?: KeyOfEncoding): Buffer

  static alloc (size: number, fill?: any, encoding: KeyOfEncoding = 'utf8'): Buffer {
    if (!_.isSafeInteger(size) || size >= K_MAX_LENGTH) throw new RangeError(`Invalid size: ${size}`)
    const buf = new Buffer(size)
    if (_.isNil(fill)) return buf
    return _.isNil(encoding) ? buf.fill(fill) : buf.fill(fill, encoding)
  }

  /**
   * Allocates a new `Buffer` of `size` bytes. The contents are initialized to `0`. This is equivalent to calling `new Buffer(size)`.
   * @remarks This method is different from Node.js's `Buffer.allocUnsafe()` method.
   * @param size - The desired length of the new Buffer.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.allocUnsafe(10)
   *   console.log(buf.toString('hex')) // Prints: 00000000000000000000
   * })()
   * ```
   */
  static allocUnsafe (size: number): Buffer {
    if (!_.isSafeInteger(size) || size < 0) throw new TypeError(`Invalid size: ${size}`)
    return new Buffer(size)
  }

  /**
   * Allocates a new `Buffer` of `size` bytes. The contents are initialized to `0`. This is equivalent to calling `new Buffer(size)`.
   * @remarks This method is different from Node.js's `Buffer.allocUnsafeSlow()` method.
   * @param size - The desired length of the new Buffer.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.allocUnsafeSlow(10)
   *   console.log(buf.toString('hex')) // Prints: 00000000000000000000
   * })()
   * ```
   */
  static allocUnsafeSlow (size: number): Buffer {
    if (!_.isSafeInteger(size) || size < 0) throw new TypeError(`Invalid size: ${size}`)
    return new Buffer(size)
  }

  /**
   * Returns `.byteLength` if `value` is a `Buffer`/`DataView`/`TypedArray`/`ArrayBuffer`/`SharedArrayBuffer`.
   * @param value - A value to calculate the length of bytes.
   * @returns The number of bytes contained within `value`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const u8arr = new Uint8Array(5)
   *   console.log(Buffer.byteLength(u8arr)) // Prints: 5
   * })()
   * ```
   */
  static byteLength (value: ArrayBufferLike | ArrayBufferView): number

  /**
   * Returns the byte length of a string when encoded using `encoding`. This is not the same as `String.prototype.length`, which does not account for the `encoding` that is used to convert the string into bytes.
   *
   * For `'base64'`, `'base64url'`, and `'hex'`, this method assumes `value` is valid. For strings that contain non-base64/hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.
   * @param string - A value to calculate the length of bytes.
   * @param encoding - The encoding of `string`. Default: `'utf8'`.
   * @returns The number of bytes contained within `string`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const str = '\u00bd + \u00bc = \u00be'
   *   console.log(`${str}: ${str.length} characters, ${Buffer.byteLength(str, 'utf8')} bytes`)
   *   // Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
   * })()
   * ```
   */
  static byteLength (string: string, encoding?: KeyOfEncoding): number

  static byteLength (value: any, encoding: KeyOfEncoding = 'utf8'): number {
    if (Buffer.isBuffer(value) || isInstance(value, ArrayBuffer) || isSharedArrayBuffer(value) || ArrayBuffer.isView(value)) return value.byteLength
    if (!_.isString(value)) throw new TypeError(`Invalid type of string: ${typeof value}`)

    if (_.includes(['ascii', 'latin1', 'binary'], encoding)) return value.length
    if (_.includes(['ucs2', 'ucs-2', 'utf16le', 'utf-16le'], encoding)) return value.length * 2
    if (encoding === 'hex') return value.length >>> 1
    if (_.includes(['base64', 'base64url'], encoding)) return (value.replace(/[^A-Za-z0-9/_+-]/g, '').length * 3) >>> 2
    return new TextEncoder().encode(value).length // default utf8
  }

  /**
   * Compares `buf1` to `buf2`, typically for the purpose of sorting arrays of `Buffer` instances. This is equivalent to calling `buf1.compare(buf2)`.
   * @param buf1 -
   * @param buf2 -
   * @returns Either `-1`, `0`, or `1`, depending on the result of the comparison. See `buf.compare()` for details.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('1234')
   *   const buf2 = Buffer.from('0123')
   *
   *   console.log([buf1, buf2].sort(Buffer.compare).map(buf => buf.toString('hex')))
   *   // Prints: ['30313233', '31323334']
   *   // (This result is equal to: [buf2, buf1].)
  *
   *   console.log([buf2, buf1].sort(Buffer.compare).map(buf => buf.toString('hex')))
   *   // Prints: ['30313233', '31323334']
   * })()
   * ```
   */
  static compare (buf1: Buffer | Uint8Array, buf2: Buffer | Uint8Array): number

  static compare (buf1: any, buf2: any): number {
    if (!Buffer.isBuffer(buf1)) {
      if (!ArrayBuffer.isView(buf1)) throw new TypeError('Invalid type')
      buf1 = Buffer.fromView(buf1)
    }
    return buf1.compare(buf2)
  }

  /**
   * Returns a new `Buffer` which is the result of concatenating all the `Buffer` instances in the `list` together.
   *
   * If the `list` has no items, or if the `totalLength` is 0, then a new zero-length `Buffer` is returned.
   *
   * If `totalLength` is not provided, it is calculated from the `Buffer` instances in `list` by adding their lengths.
   *
   * If `totalLength` is provided, it is coerced to an unsigned integer. If the combined length of the `Buffer`s in `list` exceeds `totalLength`, the result is truncated to `totalLength`.
   * @param list - List of `Buffer` or `Uint8Array` instances to concatenate.
   * @param totalLength - Total length of the `Buffer` instances in `list` when concatenated.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.alloc(4)
   *   const buf2 = Buffer.alloc(5)
   *   const buf3 = Buffer.alloc(6)
   *   const totalLength = buf1.length + buf2.length + buf3.length
   *   console.log(totalLength) // Prints: 15
   *
   *   const bufA = Buffer.concat([buf1, buf2, buf3], totalLength)
   *   console.log(bufA.toString('hex'))
   *   // Prints: 000000000000000000000000000000
   *   console.log(bufA.length) // Prints: 15
   * })()
   * ```
   */
  static concat (list: Buffer[], totalLength?: number): Buffer {
    if (!_.isArray(list)) throw new TypeError('"list" argument must be an array of Buffers')
    if (_.isNil(totalLength)) totalLength = _.sumBy(list, 'length')
    if (totalLength < 0) totalLength = 0
    const buf = new Buffer(totalLength)
    let start = 0
    for (let i = 0; i < list.length; i++) {
      if (start + list[i].length > totalLength) list[i] = list[i].subarray(0, totalLength - start)
      buf.set(list[i], start)
      start += list[i].length
    }
    return buf
  }

  /**
   * Copies the underlying memory of `view` into a new `Buffer`.
   * @param view - The `TypedArray` to copy.
   * @param offset - The starting offset within `view`. Default: `0`.
   * @param length - The number of elements from `view` to copy. Default: `view.length - offset`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const u16 = new Uint16Array([0, 0xffff])
   *   const buf = Buffer.copyBytesFrom(u16, 1, 1)
   *   u16[1] = 0
   *   console.log(buf.length) // Prints: 2
   *   console.log(buf.toString('hex')) // Prints: ffff
   * })()
   * ```
   */
  static copyBytesFrom (view: ArrayBufferView, offset: number = 0, length?: number): Buffer {
    return new Buffer(Buffer.fromView(view, offset, length))
  }

  /**
   * @returns `ture` if `buf1` and `buf2` have the same byte length and contents, or `false` otherwise.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.equals(new Buffer([1, 2]), Buffer.from('0102', 'hex'))) // true
   *   console.log(Buffer.equals(Buffer.from(new Uint8Array([1, 2])), Buffer.from('0102', 'hex'))) // true
   *   console.log(Buffer.equals(new Uint8Array([1, 2]), Buffer.from('0102', 'hex'))) // false
   *   console.log(Buffer.equals(1, new Uint8Array([1, 2]))) // false
   *   console.log(Buffer.equals('', new Buffer(2))) // false
   * })()
   * ```
   */
  static equals (buf1: Buffer, buf2: Buffer): boolean

  static equals (buf1: any, buf2: any): boolean {
    return Buffer.isBuffer(buf1) && buf1.equals(buf2)
  }

  /**
   * Allocates a new `Buffer` using an `array` of bytes in the range `0` – `255`. Array entries outside that range will be truncated to fit into it.
   *
   * If `array` is an `Array`-like object (that is, one with a `length` property of type `number`), it is treated as if it is an array, unless it is a `Buffer` or a `Uint8Array`. This means all other `TypedArray` variants get treated as an `Array`. To create a `Buffer` from the bytes backing a `TypedArray`, use `Buffer.copyBytesFrom()`.
   * @param array -
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
   *   console.log(buf1.toString('hex')) // Prints: 627566666572
   *
   *   const u16 = new Uint16Array([0x0001, 0x0002])
   *   const buf2 = Buffer.from(u16)
   *   console.log(buf2.toString('hex')) // Prints: 0102
   * })()
   * ```
   */
  static from (array: OrValueOf<ArrayLike<number> | Iterable<number>>): Buffer

  /**
   * This creates a view of the `ArrayBuffer` without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a `TypedArray` instance, the newly created `Buffer` will share the same allocated memory as the `TypedArray`'s underlying `ArrayBuffer`.
   *
   * The optional byteOffset and length arguments specify a memory range within the arrayBuffer that will be shared by the Buffer.
   *
   * It is important to remember that a backing `ArrayBuffer` can cover a range of memory that extends beyond the bounds of a `TypedArray` view. A new `Buffer` created using the `buffer` property of a `TypedArray` may extend beyond the range of the `TypedArray`:
   * @param arrayBuffer - An `ArrayBuffer`, `SharedArrayBuffer`, for example the `.buffer` property of a `TypedArray`.
   * @param byteOffset - Index of first byte to expose. Default: `0`.
   * @param length - Number of bytes to expose. Default: `arrayBuffer.byteLength - byteOffset`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const arr = new Uint16Array(2)
   *   arr[0] = 5000
   *   arr[1] = 4000
   *   const buf = Buffer.from(arr.buffer) // Shares memory with `arr`
   *   console.log(buf.toString('hex')) // Prints: 8813a00f
   *
   *   // Changing the original Uint16Array changes the Buffer also.
   *   arr[1] = 6000
   *   console.log(buf.toString('hex')) // Prints: 88137017
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const ab = new ArrayBuffer(10)
   *   const buf = Buffer.from(ab, 0, 2)
   *   console.log(buf.length) // Prints: 2
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const arrA = Uint8Array.from([0x63, 0x64, 0x65, 0x66]) // 4 elements
   *   const arrB = new Uint8Array(arrA.buffer, 1, 2) // 2 elements
   *   console.log(arrA.buffer === arrB.buffer) // true
   *
   *   const buf = Buffer.from(arrB.buffer)
   *   console.log(buf.toString('hex')) // Prints: 63646566
   * })()
   * ```
   */
  static from (arrayBuffer: OrValueOf<ArrayBufferLike>, byteOffset?: number, length?: number): Buffer

  /**
   * Copies the passed `buffer` data onto a new `Buffer` instance.
   * @param buffer - An existing `Buffer` or `Uint8Array` from which to copy data.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('buffer')
   *   const buf2 = Buffer.from(buf1)
   *   buf1[0] = 0x61
   *   console.log(buf1.toString()) // Prints: auffer
   *   console.log(buf2.toString()) // Prints: buffer
   * })()
   * ```
   */
  static from (buffer: OrValueOf<Buffer | Uint8Array>): Buffer

  /**
   * Restore a `Buffer` in the format returned from `Buffer#toJSON()`.
   * @param json - A JSON object returned from `Buffer#toJSON()`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('buffer')
   *   const buf2 = Buffer.from(buf1.toJSON())
   *   console.log(buf1.equals(buf2)) // Prints: true
   * })()
   * ```
   */
  static from (json: { type: 'Buffer', data: number[] }): Buffer

  /**
   * Creates a new `Buffer` containing `string`. The `encoding` parameter identifies the character encoding to be used when converting `string` into bytes.
   * @param object - A string to encode.
   * @param encoding - The encoding of string. Default: `'utf8'`.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('this is a tést')
   *   const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex')
   *
   *   console.log(buf1.toString()) // Prints: this is a tést
   *   console.log(buf2.toString()) // Prints: this is a tést
   *   console.log(buf1.toString('latin1')) // Prints: this is a tÃ©st
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from(new String('this is a test'))
   *   console.log(buf.toString('hex')) // Prints: 7468697320697320612074657374
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   class Foo {
   *     [Symbol.toPrimitive]() {
   *       return 'this is a test';
   *     }
   *   }
   *
   *   const buf = Buffer.from(new Foo(), 'utf8')
   *   console.log(buf.toString('hex')) // Prints: 7468697320697320612074657374
   * })()
   * ```
   */
  static from (object: OrValueOf<string> | { [Symbol.toPrimitive]: (hint?: 'string') => string }, encoding?: KeyOfEncoding): Buffer

  static from (val: any, encodingOrOffset?: any, length?: number): Buffer {
    const valueOfObj = val?.[Symbol.toPrimitive]?.('string') ?? val?.valueOf?.()
    if (!_.isNil(valueOfObj) && valueOfObj !== val) val = valueOfObj

    if (_.isString(val)) return Buffer.fromString(val, encodingOrOffset)
    if (ArrayBuffer.isView(val) || _.isArray(val) || isIterable<number>(val)) return new Buffer(val)
    if (val?.type === 'Buffer' && _.isArray(val.data)) return new Buffer(val.data)
    if (isInstance(val, ArrayBuffer) || isSharedArrayBuffer(val)) return new Buffer(val, encodingOrOffset, length)

    throw new TypeError(`Invalid type of value: ${typeof val}`)
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `latin1` using Latin-1 encoding. Latin-1 stands for [ISO-8859-1](https://en.wikipedia.org/wiki/ISO-8859-1). This character encoding only supports the Unicode characters from U+0000 to U+00FF. Each character is encoded using a single byte. Characters that do not fit into that range are truncated and will be mapped to characters in that range.
   * @param latin1 - A string to encode.
   * @group Static Methods
   */
  static fromLatin1String (latin1: string): Buffer {
    const buf = new Buffer(latin1.length)
    for (let i = 0; i < latin1.length; i++) buf[i] = latin1.charCodeAt(i) & 0xFF
    return buf
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `base64` using [Base64](https://en.wikipedia.org/wiki/Base64) encoding. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5). Whitespace characters such as spaces, tabs, and new lines contained within the base64-encoded string are ignored.
   * @param base64 - A string to encode.
   * @group Static Methods
   */
  static fromBase64String (base64: string): Buffer {
    base64 = base64.replace(/[^A-Za-z0-9/_+-]/g, '')
    const tmp1 = base64.length
    const tmp2 = base64.length + 3
    base64 = `${base64}AAA`.slice(0, tmp2 - tmp2 % 4)
    const buf = new Buffer(base64.length * 3 >>> 2)
    let parsedLen = 0
    for (let i = 0; i < base64.length; i += 4) {
      const u24 = (CHARCODE_BASE64.get(base64[i]) << 18) +
        (CHARCODE_BASE64.get(base64[i + 1]) << 12) +
        (CHARCODE_BASE64.get(base64[i + 2]) << 6) +
        CHARCODE_BASE64.get(base64[i + 3])
      buf[parsedLen++] = (u24 >>> 16) & 0xFF
      buf[parsedLen++] = (u24 >>> 8) & 0xFF
      buf[parsedLen++] = (u24 >>> 0) & 0xFF
    }
    return tmp1 < base64.length ? buf.subarray(0, tmp1 - base64.length) : buf
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `base64` using base64url encoding. [base64url](https://tools.ietf.org/html/rfc4648#section-5) encoding as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5). When creating a `Buffer` from a string, this encoding will also correctly accept regular base64-encoded strings.
   * @param base64 - A string to encode.
   * @group Static Methods
   */
  static fromBase64urlString (base64: string): Buffer {
    return Buffer.fromBase64String(base64)
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `hex` using hexadecimal encoding. Data truncation may occur when encode strings that do not exclusively consist of an even number of hexadecimal characters.
   * @param hex - A string to encode.
   * @group Static Methods
   */
  static fromHexString (hex: string): Buffer {
    hex = hex.replace(/[^0-9A-Fa-f]/g, '')
    const buf = new Buffer(hex.length >>> 1)
    for (let i = 0; i < buf.length; i++) buf[i] = CHARCODE_HEX.get(hex[i * 2]) << 4 | CHARCODE_HEX.get(hex[i * 2 + 1])
    return buf
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `string`. The `encoding` parameter identifies the character encoding to be used when converting `string` into bytes.
   * @param string - A string to encode.
   * @param encoding - The encoding of `string`. Default: `'utf8'`.
   * @group Static Methods
   */
  static fromString (string: string, encoding: KeyOfEncoding): Buffer

  static fromString (string: string, encoding: string = 'utf8'): Buffer {
    encoding = _.toLower(encoding)
    if (!Buffer.isEncoding(encoding)) throw new TypeError(`Unknown encoding: ${encoding}`)
    return Buffer[fromStringFns[encoding]](string)
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `ucs2` using UCS-2 encoding. UCS-2 used to refer to a variant of UTF-16 that did not support characters that had code points larger than U+FFFF. In Node.js, these code points are always supported.
   * @param ucs2 - A string to encode.
   * @group Static Methods
   */
  static fromUcs2String (ucs2: string): Buffer {
    const buf = new Buffer(ucs2.length * 2)
    for (let i = 0; i < ucs2.length; i++) buf.writeUInt16LE(ucs2.charCodeAt(i), i * 2)
    return buf
  }

  /**
   * Creates a new `Buffer` that encoded from the provided `utf8` using UTF-8 encoding. Multi-byte encoded Unicode characters. Many web pages and other document formats use [UTF-8](https://en.wikipedia.org/wiki/UTF-8). This is the default character encoding.
   * @param utf8 - A string to encode.
   * @see This method based on the [TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode) API.
   * @group Static Methods
   */
  static fromUtf8String (utf8: string): Buffer {
    return Buffer.fromView(new TextEncoder().encode(utf8))
  }

  /**
   * Creates a `Buffer` from `view` without copying the underlying memory.
   * @param view - The `ArrayBufferView` to create a `Buffer` from.
   * @param offset - The starting offset within `view`. Default: `0`.
   * @param length - The number of elements from `view` to copy. Default: `view.length - offset`.
   * @group Static Methods
   */
  static fromView (view: ArrayBufferView, offset?: number, length?: number): Buffer

  static fromView (view: any, offset: number = 0, length?: number): Buffer {
    if (!ArrayBuffer.isView(view)) throw new TypeError('invalid view')
    const bytesPerElement = (view as any)?.BYTES_PER_ELEMENT ?? 1
    const viewLength = view.byteLength / bytesPerElement
    if (_.isNil(length)) length = viewLength - offset
    return new Buffer(view.buffer, view.byteOffset + offset * bytesPerElement, length * bytesPerElement)
  }

  /**
   * A helper function which `Buffer.isBuffer()` will invoke and determine whether `this` is a `Buffer` or not.
   * @returns `true` if `this` is a `Buffer`, `false` otherwise.
   */
  [customBufferSymbol] (): boolean { return true }

  /**
   * @returns `true` if `obj` is a `Buffer`, `false` otherwise.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.isBuffer(Buffer.alloc(10))) // true
   *   console.log(Buffer.isBuffer(Buffer.from('foo'))) // true
   *   console.log(Buffer.isBuffer('a string')) // false
   *   console.log(Buffer.isBuffer([])) // false
   *   console.log(Buffer.isBuffer(new Uint8Array(1024))) // false
   * })()
   * ```
   */
  static isBuffer (obj: any): obj is Buffer {
    return obj?.[customBufferSymbol]?.() ?? false
  }

  /**
   * @returns `true` if `encoding` is the name of a supported character encoding, or `false` otherwise.
   * @param encoding - A character encoding name to check.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.isEncoding('utf8')) // true
   *   console.log(Buffer.isEncoding('hex')) // true
   *   console.log(Buffer.isEncoding('utf/8')) // false
   *   console.log(Buffer.isEncoding('')) // false
   * })()
   * ```
   */
  static isEncoding (encoding: any): encoding is KeyOfEncoding {
    return encoding in Encoding
  }

  /**
   * Parse a format string `format`. This is a internal method used by `Buffer.packCalcSize()`, `Buffer.pack()` and `Buffer.unpack()`.
   * @param format - A format string.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @group Static Methods
   */
  static packParseFormat (format: string): PackFormat {
    if (!_.isString(format)) throw new TypeError('Invalid type of format')
    const matched = /^([@=<>!]?)((?:\d*[xcbB?hHiIlLqQefdsp])+)$/.exec(format)
    if (_.isNil(matched)) throw new TypeError(`Invalid format: ${format}`)
    const littleEndian = _.includes(['', '@', '='], matched[1]) ? isNativeLittleEndian : (matched[1] === '<')
    return {
      littleEndian,
      items: _.map([...matched[2].matchAll(/\d*[xcbB?hHiIlLqQefdsp]/g)], ([s]) => {
        const type = s[s.length - 1]
        const repeat = s.length > 1 ? _.parseInt(s.slice(0, -1)) : 1
        return [(type === 'p' && repeat > 255) ? 255 : repeat, type]
      }),
    }
  }

  /**
   * Return the required size corresponding to the format string `formatOrItems`.
   * @param formatOrItems - A format string or parsed items return by `Buffer.packParseFormat().items`.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.packCalcSize('>bhl')) // Prints: 7
   *   console.log(Buffer.packCalcSize('>ci')) // Prints: 5
   *   console.log(Buffer.packCalcSize('>ic')) // Prints: 5
   *   console.log(Buffer.packCalcSize('>lhl')) // Prints: 10
   *   console.log(Buffer.packCalcSize('>llh')) // Prints: 10
   *   console.log(Buffer.packCalcSize('>llh0l')) // Prints: 10
   *   console.log(Buffer.packCalcSize('<qh6xq')) // Prints: 24
   *   console.log(Buffer.packCalcSize('<qqh6x')) // Prints: 24
   * })()
   * ```
   */
  static packCalcSize (formatOrItems: string | PackFormat['items']): number {
    if (_.isString(formatOrItems)) formatOrItems = Buffer.packParseFormat(formatOrItems)?.items
    return _.sumBy(formatOrItems, item => {
      const [repeat, type] = item
      if ('hHe'.includes(type)) return repeat * 2
      if ('iIlLf'.includes(type)) return repeat * 4
      if ('qQd'.includes(type)) return repeat * 8
      return repeat // xcbB?sp
    })
  }

  /**
   * Creates a new `Buffer` containing the `vals` packed according to the format string `format`. The arguments must match the `vals` required by the `format` exactly.
   * @param format - A format string.
   * @param vals - Values to pack.
   * @group Static Methods
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @see Please refer to [Python struct — Interpret bytes as packed binary data](https://docs.python.org/3/library/struct.html) for more information.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.pack('>h', 1023).toString('hex')) // Prints: 03ff
   *   console.log(Buffer.pack('<h', 1023).toString('hex')) // Prints: ff03
   *   console.log(Buffer.pack('>bhl', 1, 2, 3).toString('hex')) // Prints: 01000200000003
   * })()
   * ```
   */
  static pack (format: string, ...vals: any[]): Buffer

  /**
   * Pack `vals` into `buf` according to the format string `format`. The arguments must match the `vals` required by the `format` exactly. The `buf`’s size in bytes must larger then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param buf - A `Buffer` to pack into.
   * @param format - A format string.
   * @param vals - Values to pack.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.alloc(3)
   *   Buffer.pack(buf1, '>h', 0x0102)
   *   console.log(buf1.toString('hex')) // Prints: 010200
   *
   *   const buf2 = Buffer.alloc(3)
   *   Buffer.pack(buf2.subarray(1), '>h', 0x0102) // struct.pack_into
   *   console.log(buf2.toString('hex')) // Prints: 000102
   * })()
   * ```
   */
  static pack (buf: Buffer, format: string, ...vals: any[]): Buffer

  static pack (buf: any, format: any, ...vals: any[]): Buffer {
    if (_.isString(buf)) { // shift arguments
      vals.unshift(format)
      ;[buf, format] = [undefined, buf]
    }

    const { littleEndian, items } = Buffer.packParseFormat(format)
    const lenRequired = Buffer.packCalcSize(items)
    if (_.isNil(buf)) buf = new Buffer(lenRequired)
    if (!Buffer.isBuffer(buf)) throw new TypeError('Invalid type of buf')
    if (buf.length < lenRequired) throw new RangeError(`buf.length = ${buf.length}, lenRequired = ${lenRequired}`)

    const ctx = { buf, littleEndian, offset: 0, vals }
    for (const [repeat, type] of items) {
      const packFromFn = packFromFns.get(type)
      if (_.isNil(packFromFn)) throw new Error(`Unknown format: ${repeat}${type}`)
      packFromFn(_.merge(ctx, { repeat, type }))
    }

    return buf
  }

  /**
   * Unpack from the `buf` (presumably packed by `pack(format, ...))` according to the format string `format`. The result is a tuple even if it contains exactly one item. The `buf`’s size in bytes must larger then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param buf - A `Buffer` to unpack from.
   * @param format - A format string.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('01fe01fe', 'hex')
   *   console.log(Buffer.unpack(buf1, '!BBbb')) // Prints: [1, 254, 1, -2]
   * })()
   * ```
   */
  static unpack <T extends any[]> (buf: Buffer, format: string): T {
    const { littleEndian, items } = Buffer.packParseFormat(format)
    const lenRequired = Buffer.packCalcSize(items)
    if (!Buffer.isBuffer(buf)) throw new TypeError('Invalid type of buf')
    if (buf.length < lenRequired) throw new RangeError(`buf.length = ${buf.length}, lenRequired = ${lenRequired}`)

    const ctx = { buf, littleEndian, offset: 0, vals: [] }
    for (const [repeat, type] of items) {
      const unpackToFn = unpackToFns.get(type)
      if (_.isNil(unpackToFn)) throw new Error(`Unknown format: ${repeat}${type}`)
      unpackToFn(_.merge(ctx, { repeat, type }))
    }

    return ctx.vals as unknown as T
  }

  /**
   * Iteratively unpack from the `buf` according to the format string `format`. This method returns an iterator which will read equally sized chunks from the `buf` until remaining contents smaller then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param buf - A `Buffer` to unpack from.
   * @param format - A format string.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @group Static Methods
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('01fe01fe', 'hex')
   *   console.log([...Buffer.iterUnpack(buf1, '!BB')]) // Prints: [[1, 254], [1, 254]]
   * })()
   * ```
   */
  static * iterUnpack <T extends any[]> (buf: Buffer, format: string): Generator<T> {
    const { littleEndian, items } = Buffer.packParseFormat(format)
    const lenRequired = Buffer.packCalcSize(items)
    if (!Buffer.isBuffer(buf)) throw new TypeError('Invalid type of buf')
    if (buf.length < lenRequired) throw new RangeError(`buf.length = ${buf.length}, lenRequired = ${lenRequired}`)

    while (lenRequired <= buf.length) {
      const ctx = { buf, littleEndian, offset: 0, vals: [] }
      for (const [repeat, type] of items) {
        const unpackToFn = unpackToFns.get(type)
        if (_.isNil(unpackToFn)) throw new Error(`Unknown format: ${repeat}${type}`)
        unpackToFn(_.merge(ctx, { repeat, type }))
      }
      yield ctx.vals as unknown as T
      buf = buf.subarray(lenRequired)
    }
  }

  /**
   * Compares `buf` with `target` and returns a number indicating whether `buf` comes before, after, or is the same as `target` in sort order. Comparison is based on the actual sequence of bytes in each `Buffer`.
   *
   * The optional `targetStart`, `targetEnd`, `sourceStart`, and `sourceEnd` arguments can be used to limit the comparison to specific ranges within `target` and `buf` respectively.
   * @param target - A `Buffer` or `Uint8Array` with which to compare `buf`.
   * @param targetStart - The offset within `target` at which to begin comparison. Default: `0`.
   * @param targetEnd - The offset within `target` at which to end comparison (not inclusive). Default: `target.length`.
   * @param sourceStart - The offset within `buf` at which to begin comparison. Default: `0`.
   * @param sourceEnd - The offset within buf at which to end comparison (not inclusive). Default: `this.length`.
   * @returns
   * - `0` is returned if `target` is the same as `buf`
   * - `1` is returned if `target` should come before `buf` when sorted.
   * - `-1` is returned if `target` should come after `buf` when sorted.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('ABC')
   *   const buf2 = Buffer.from('BCD')
   *   const buf3 = Buffer.from('ABCD')
   *
   *   console.log(buf1.compare(buf1)) // Prints: 0
   *   console.log(buf1.compare(buf2)) // Prints: -1
   *   console.log(buf1.compare(buf3)) // Prints: -1
   *   console.log(buf2.compare(buf1)) // Prints: 1
   *   console.log(buf2.compare(buf3)) // Prints: 1
   *
   *   console.log([buf1, buf2, buf3].sort(Buffer.compare).map(buf => buf.toString()))
   *   // Prints: ['ABC', 'ABCD', 'BCD']
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9])
   *   const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4])
   *
   *   console.log(buf1.compare(buf2, 5, 9, 0, 4)) // Prints: 0
   *   console.log(buf1.compare(buf2, 0, 6, 4)) // Prints: -1
   *   console.log(buf1.compare(buf2, 5, 6, 5)) // Prints: 1
   * })()
   * ```
   */
  compare (
    target: any,
    targetStart: number = 0,
    targetEnd: number = target.length,
    sourceStart: number = 0,
    sourceEnd: number = this.length
  ): number {
    if (!Buffer.isBuffer(target)) {
      if (!ArrayBuffer.isView(target)) throw new TypeError('Invalid type')
      target = Buffer.fromView(target)
    }
    const me = this.subarray(sourceStart, sourceEnd)
    target = target.subarray(targetStart, targetEnd)
    const len = Math.min(me.length, target.length)
    for (let i = 0; i < len; i++) {
      if (me[i] !== target[i]) return me[i] < target[i] ? -1 : 1
    }
    return me.length === target.length ? 0 : (me.length < target.length ? -1 : 1)
  }

  /**
   * Copies data from a region of `buf` to a region in `target`, even if the `target` memory region overlaps with `buf`.
   *
   * `TypedArray.prototype.set()` performs the same operation, and is available for all TypedArrays, including Node.js `Buffer`s, although it takes different function arguments.
   * @param target - A `Buffer` or `Uint8Array` to copy into.
   * @param targetStart - The offset within `target` at which to begin writing. Default: `0`.
   * @param sourceStart - The offset within `buf` from which to begin copying. Default: `0`.
   * @param sourceEnd - The offset within `buf` at which to stop copying (not inclusive). Default: `this.length`.
   * @returns The number of bytes copied.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.allocUnsafe(26)
   *   const buf2 = Buffer.allocUnsafe(26).fill('!')
   *
   *   // 97 is the decimal ASCII value for 'a'.
   *   for (let i = 0; i < 26; i++) buf1[i] = i + 97
   *
   *   // Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`.
   *   buf1.copy(buf2, 8, 16, 20)
   *   // This is equivalent to:
   *   // buf2.set(buf1.subarray(16, 20), 8)
   *
   *   console.log(buf2.toString('ascii', 0, 25))
   *   // Prints: !!!!!!!!qrst!!!!!!!!!!!!!
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   // Create a `Buffer` and copy data from one region to an overlapping region within the same `Buffer`.
   *   const buf = Buffer.allocUnsafe(26)
   *
   *   // 97 is the decimal ASCII value for 'a'.
   *   for (let i = 0; i < 26; i++) buf[i] = i + 97
   *   buf.copy(buf, 0, 4, 10)
   *
   *   console.log(buf.toString())
   *   // Prints: efghijghijklmnopqrstuvwxyz
   * })()
   * ```
   */
  copy (target: Buffer, targetStart: number = 0, sourceStart: number = 0, sourceEnd: number = this.length): number {
    let buf = this.subarray(sourceStart, sourceEnd)
    if (buf.length > target.length - targetStart) buf = buf.subarray(0, target.length - targetStart)
    target.set(buf, targetStart)
    return buf.length
  }

  /**
   * @param otherBuffer - A Buffer or Uint8Array with which to compare buf.
   * @returns `true` if both `buf` and `otherBuffer` have exactly the same bytes, `false` otherwise. Equivalent to `buf.compare(otherBuffer) === 0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('ABC')
   *   const buf2 = Buffer.from('414243', 'hex')
   *   const buf3 = Buffer.from('ABCD')
   *
   *   console.log(buf1.equals(buf2)) // Prints: true
   *   console.log(buf1.equals(buf3)) // Prints: false
   * })()
   * ```
   */
  equals (otherBuffer: Buffer | Uint8Array): boolean

  equals (otherBuffer: any): boolean {
    if (!Buffer.isBuffer(otherBuffer) || this.length !== otherBuffer.length) return false
    for (let i = 0; i < this.length; i++) if (this[i] !== otherBuffer[i]) return false
    return true
  }

  fill (value: string, encoding?: KeyOfEncoding): this
  fill (value: string, offset: number, encoding?: KeyOfEncoding): this
  fill (value: string, offset: number, end: number, encoding?: KeyOfEncoding): this

  /**
   * @param value - The value with which to fill `buf`. Empty value (Uint8Array, Buffer) is coerced to `0`. `value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.
   * @param offset - Number of bytes to skip before starting to fill `buf`. Default: `0`.
   * @param end - Where to stop filling `buf` (not inclusive). Default: `buf.length`.
   * @example
   * Fills `buf` with the specified `value`. If the `offset` and `end` are not given, the entire `buf` will be filled:
   *
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   // Fill a `Buffer` with the ASCII character 'h'.
   *   const b = Buffer.allocUnsafe(10).fill('h')
   *   console.log(b.toString()) // Prints: hhhhhhhhhh
   *
   *   // Fill a buffer with empty string
   *   const c = Buffer.allocUnsafe(5).fill('')
   *   console.log(c.toString('hex')) // Prints: 0000000000
   * })()
   * ```
   * @example
   * If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:
   *
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   // Fill a `Buffer` with character that takes up two bytes in UTF-8.
   *   const b = Buffer.allocUnsafe(5).fill('\u0222')
   *   console.log(b.toString('hex')) // Prints: c8a2c8a2c8
   * })()
   * ```
   * @example
   * If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:
   *
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.allocUnsafe(5)
   *
   *   console.log(buf.fill('a').toString('hex')) // Prints: 6161616161
   *   console.log(buf.fill('aazz', 'hex').toString('hex')) // Prints: aaaaaaaaaa
   *   console.log(buf.fill('zz', 'hex').toString('hex')) // Throws an exception.
   * })()
   * ```
   */
  fill (value: Buffer | Uint8Array | number, offset?: number, end?: number): this

  /**
   * @param value - The value with which to fill buf. Empty string is coerced to `0`.
   * @param offset - Number of bytes to skip before starting to fill `buf`. Default: `0`.
   * @param end - Where to stop filling `buf` (not inclusive). Default: `buf.length`.
   * @param encoding - The encoding for `value`. Default: `'utf8'`.
   */
  fill (value: any, offset: any = 0, end: any = this.length, encoding: KeyOfEncoding = 'utf8'): this {
    if (Buffer.isEncoding(offset)) [offset, encoding] = [0, offset]
    if (Buffer.isEncoding(end)) [end, encoding] = [this.length, end]
    if (!_.isSafeInteger(offset) || !_.isSafeInteger(end)) throw new RangeError('Invalid type of offset or end')

    if (_.isString(value)) {
      const encoded = Buffer.fromString(value, encoding)
      if (encoded.length === 0 && value.length > 0) throw new ReferenceError('Failed to encode string')
      value = encoded
    } else if (isInstance(value, Uint8Array)) value = Buffer.fromView(value)

    if (Buffer.isBuffer(value) && value.length < 2) value = value.length > 0 ? value[0] : 0 // try to convert Buffer to number
    if (_.isNumber(value)) {
      value = _.toSafeInteger(value) & 0xFF
      for (let i = offset; i < end; i++) this[i] = value
      return this
    }
    let tmp = 0
    for (let i = offset; i < end; i++) {
      this[i] = value[tmp++]
      if (tmp >= value.length) tmp = 0
    }
    return this
  }

  includes (value: string, encoding?: KeyOfEncoding): boolean
  includes (value: string, byteOffset: number, encoding?: KeyOfEncoding): boolean

  /**
   * Equivalent to `buf.indexOf() !== -1`.
   * @param value - What to search for.
   * @param byteOffset - Where to begin searching in `buf`. If negative, then offset is calculated from the end of `buf`. Default: `0`.
   * @returns `true` if `value` was found in `buf`, `false` otherwise.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('this is a buffer')
   *   console.log(buf.includes('this')) // Prints: true
   *   console.log(buf.includes('is')) // Prints: true
   *   console.log(buf.includes(Buffer.from('a buffer'))) // Prints: true
   *   console.log(buf.includes(97)) // Prints: true (97 is the decimal ASCII value for 'a')
   *   console.log(buf.includes(Buffer.from('a buffer example'))) // Prints: false
   *   console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8))) // Prints: true
   *   console.log(buf.includes('this', 4)) // Prints: false
   * })()
   * ```
   */
  includes (value: Buffer | Uint8Array | number, byteOffset?: number): boolean

  /**
   * Equivalent to `buf.indexOf() !== -1`.
   * @param value - What to search for.
   * @param byteOffset - Where to begin searching in `buf`. If negative, then offset is calculated from the end of `buf`. Default: `0`.
   * @param encoding - The encoding of `value`. Default: `'utf8'`.
   * @returns `true` if `value` was found in `buf`, `false` otherwise.
   */
  includes (value: any, byteOffset: any = 0, encoding: KeyOfEncoding = 'utf8'): boolean {
    if (Buffer.isEncoding(byteOffset)) [byteOffset, encoding] = [0, byteOffset]
    byteOffset = _.toSafeInteger(byteOffset)
    if (byteOffset < 0) byteOffset = this.length + byteOffset

    if (_.isString(value)) value = Buffer.fromString(value, encoding)
    else if (isInstance(value, Uint8Array)) value = Buffer.fromView(value)

    if (Buffer.isBuffer(value)) { // try to convert Buffer to number
      if (value.length === 0) return false
      else if (value.length === 1) value = value[0]
    }
    if (_.isNumber(value)) {
      value = _.toSafeInteger(value) & 0xFF
      for (let i = byteOffset; i < this.length; i++) if (this[i] === value) return true
      return false
    }
    const equalsAtOffset = (i: number): boolean => {
      for (let j = 0; j < (value as Buffer).length; j++) if (this[i + j] !== (value as Buffer)[j]) return false
      return true
    }
    const len = this.length - value.length + 1
    for (let i = byteOffset; i < len; i++) if (equalsAtOffset(i)) return true
    return false
  }

  indexOf (value: string, encoding?: KeyOfEncoding): number
  indexOf (value: string, byteOffset: number, encoding?: KeyOfEncoding): number

  /**
   * @param value - What to search for.
   * - If `value` is a string, `value` is interpreted according to the character encoding in `encoding`.
   * - If `value` is a `Buffer` or `Uint8Array`, `value` will be used in its entirety. To compare a partial Buffer, use `buf.subarray`.
   * - If `value` is a number, it will be coerced to a valid byte value, an integer between `0` and `255`.
   * - If `value` is an empty string or empty Buffer and `byteOffset` is less than `buf.length`, `byteOffset` will be returned.
   * - If `value` is empty and `byteOffset` is at least `buf.length`, `buf.length` will be returned.
   * @param byteOffset - Where to begin searching in `buf`. Default: `0`.
   * - If negative, then offset is calculated from the end of `buf`.
   * - If not a integer, it will be coerced to integer by `_.toSafeInteger`.
   * @returns
   * - The index of the first occurrence of `value` in `buf`
   * - `-1` if `buf` does not contain value.
   * @throws
   * - If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('this is a buffer')
   *   console.log(buf.indexOf('this')) // Prints: 0
   *   console.log(buf.indexOf('is')) // Prints: 2
   *   console.log(buf.indexOf(Buffer.from('a buffer'))) // Prints: 8
   *   console.log(buf.indexOf(97)) // Prints: 8 (97 is the decimal ASCII value for 'a')
   *   console.log(buf.indexOf(Buffer.from('a buffer example'))) // Prints: -1
   *   console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8))) // Prints: 8
   *
   *   const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le')
   *   console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le')) // Prints: 4
   *   console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le')) // Prints: 6
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const b = Buffer.from('abcdef')
   *
   *   // Passing a value that's a number, but not a valid byte.
   *   // Prints: 2, equivalent to searching for 99 or 'c'.
   *   console.log(b.indexOf(99.9))
   *   console.log(b.indexOf(256 + 99))
   *
   *   // Passing a byteOffset that coerces to 0.
   *   // Prints: 1, searching the whole buffer.
   *   console.log(b.indexOf('b', undefined))
   *   console.log(b.indexOf('b', {}))
   *   console.log(b.indexOf('b', null))
   *   console.log(b.indexOf('b', []))
   * })()
   * ```
   */
  indexOf (value: Buffer | Uint8Array | number, byteOffset?: number): number

  /**
   * @param value - What to search for.
   * - If `value` is a string, `value` is interpreted according to the character encoding in `encoding`.
   * - If `value` is a `Buffer` or `Uint8Array`, `value` will be used in its entirety. To compare a partial Buffer, use `buf.subarray`.
   * - If `value` is a number, it will be coerced to a valid byte value, an integer between `0` and `255`.
   * - If `value` is an empty string or empty Buffer and `byteOffset` is less than `buf.length`, `byteOffset` will be returned.
   * - If `value` is empty and `byteOffset` is at least `buf.length`, `buf.length` will be returned.
   * @param byteOffset - Where to begin searching in `buf`. Default: `0`.
   * - If negative, then offset is calculated from the end of `buf`.
   * - If not a integer, it will be coerced to integer by `_.toSafeInteger`.
   * @param encoding - The encoding of `value`. Default: `'utf8'`.
   * @returns
   * - The index of the first occurrence of `value` in `buf`
   * - `-1` if `buf` does not contain value.
   * @throws
   * - If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`.
   */
  indexOf (val: any, byteOffset: any = 0, encoding: KeyOfEncoding = 'utf8'): number {
    if (Buffer.isEncoding(byteOffset)) [byteOffset, encoding] = [0, byteOffset]
    byteOffset = _.toNumber(byteOffset)
    byteOffset = _.isNaN(byteOffset) ? 0 : _.toSafeInteger(byteOffset)
    if (byteOffset < 0) byteOffset = this.length + byteOffset

    if (_.isString(val)) val = Buffer.fromString(val, encoding)
    else if (isInstance(val, Uint8Array)) val = Buffer.fromView(val)

    if (Buffer.isBuffer(val)) { // try to convert Buffer which length < 2 to number
      if (val.length === 0) return -1
      else if (val.length === 1) val = val[0]
    }
    if (_.isNumber(val)) {
      val = _.toSafeInteger(val) & 0xFF
      for (let i = byteOffset; i < this.length; i++) if (this[i] === val) return i
      return -1
    }
    const equalsAtOffset = (i: number): boolean => {
      for (let j = 0; j < (val as Buffer).length; j++) if (this[i + j] !== (val as Buffer)[j]) return false
      return true
    }
    const len = this.length - val.length + 1
    for (let i = byteOffset; i < len; i++) if (equalsAtOffset(i)) return i
    return -1
  }

  lastIndexOf (value: string, encoding?: KeyOfEncoding): number
  lastIndexOf (value: string, byteOffset: number, encoding?: KeyOfEncoding): number

  /**
   * Identical to `buf.indexOf()`, except the last occurrence of `value` is found rather than the first occurrence.
   * @param value - What to search for.
   * - If `value` is a number, it will be coerced to a valid byte value, an integer between `0` and `255`.
   * - If `value` is an empty string or empty `Buffer`, `byteOffset` will be returned.
   * @param byteOffset - Where to begin searching in `buf`. Default: `buf.length - 1`.
   * - If negative, then offset is calculated from the end of `buf`.
   * - If not a integer, it will be coerced to integer by `_.toSafeInteger`.
   * @returns
   * - The index of the last occurrence of `value` in `buf`
   * - `-1` if `buf` does not contain `value`.
   * @throws
   * - If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('this buffer is a buffer')
   *
   *   console.log(buf.lastIndexOf('this')) // Prints: 0
   *   console.log(buf.lastIndexOf('buffer')) // Prints: 17
   *   console.log(buf.lastIndexOf(Buffer.from('buffer'))) // Prints: 17
   *   console.log(buf.lastIndexOf(97)) // Prints: 15 (97 is the decimal ASCII value for 'a')
   *   console.log(buf.lastIndexOf(Buffer.from('yolo'))) // Prints: -1
   *   console.log(buf.lastIndexOf('buffer', 5)) // Prints: 5
   *   console.log(buf.lastIndexOf('buffer', 4)) // Prints: -1
   *
   *   const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le')
   *   console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le')) // Prints: 6
   *   console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le')) // Prints: 4
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const b = Buffer.from('abcdef')
   *
   *   // Passing a value that's a number, but not a valid byte.
   *   // Prints: 2, equivalent to searching for 99 or 'c'.
   *   console.log(b.lastIndexOf(99.9))
   *   console.log(b.lastIndexOf(256 + 99))
   *
   *   // Passing a byteOffset that coerces to NaN.
   *   // Prints: 1, searching the whole buffer.
   *   console.log(b.lastIndexOf('b', undefined))
   *   console.log(b.lastIndexOf('b', {}))
   *
   *   // Passing a byteOffset that coerces to 0.
   *   // Prints: -1, equivalent to passing 0.
   *   console.log(b.lastIndexOf('b', null))
   *   console.log(b.lastIndexOf('b', []))
   * })()
   * ```
   */
  lastIndexOf (value: Buffer | Uint8Array | number, byteOffset?: number): number

  /**
   * Identical to `buf.indexOf()`, except the last occurrence of `value` is found rather than the first occurrence.
   * @param value - What to search for.
   * - If `value` is a string, `value` is interpreted according to the character encoding in `encoding`.
   * - If `value` is a `Buffer` or `Uint8Array`, `value` will be used in its entirety. To compare a partial Buffer, use `buf.subarray`.
   * - If `value` is a number, it will be coerced to a valid byte value, an integer between `0` and `255`.
   * - If `value` is an empty string or empty `Buffer`, `byteOffset` will be returned.
   * @param byteOffset - Where to begin searching in `buf`. Default: `buf.length - 1`.
   * - If negative, then offset is calculated from the end of `buf`.
   * - If not a integer, it will be coerced to integer by `_.toSafeInteger`.
   * @param encoding - The encoding of `value`. Default: `'utf8'`.
   * @returns
   * - The index of the last occurrence of `value` in `buf`
   * - `-1` if `buf` does not contain `value`.
   * @throws
   * - If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`.
   */
  lastIndexOf (value: any, byteOffset: any = this.length - 1, encoding: KeyOfEncoding = 'utf8'): number {
    if (Buffer.isEncoding(byteOffset)) [byteOffset, encoding] = [this.length - 1, byteOffset]
    byteOffset = _.toNumber(byteOffset)
    byteOffset = _.isNaN(byteOffset) ? (this.length - 1) : _.toSafeInteger(byteOffset)
    if (byteOffset < 0) byteOffset = this.length + byteOffset

    if (_.isString(value)) value = Buffer.fromString(value, encoding)
    else if (isInstance(value, Uint8Array)) value = Buffer.fromView(value)

    if (Buffer.isBuffer(value)) { // try to convert Buffer to number
      if (value.length === 0) return -1
      else if (value.length === 1) value = value[0]
    }
    if (_.isNumber(value)) {
      value = _.toSafeInteger(value) & 0xFF
      for (let i = Math.min(byteOffset, this.length - 1); i >= 0; i--) if (this[i] === value) return i
      return -1
    }
    const equalsAtOffset = (i: number): boolean => {
      for (let j = 0; j < (value as Buffer).length; j++) if (this[i + j] !== (value as Buffer)[j]) return false
      return true
    }
    for (let i = Math.min(byteOffset, this.length - value.length); i >= 0; i--) if (equalsAtOffset(i)) return i
    return -1
  }

  /**
   * Reads a signed, big-endian 64-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('00000000ffffffff', 'hex')
   *   console.log(buf.readBigInt64BE(0)) // Prints: 4294967295n
   * })()
   * ```
   */
  readBigInt64BE (offset: number = 0): bigint {
    return this.#dv.getBigInt64(offset)
  }

  /**
   * Reads a signed, little-endian 64-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('00000000ffffffff', 'hex')
   *   console.log(buf.readBigInt64LE(0)) // Prints: -4294967296n
   * })()
   * ```
   */
  readBigInt64LE (offset: number = 0): bigint {
    return this.#dv.getBigInt64(offset, true)
  }

  /**
   * Reads an unsigned, big-endian 64-bit integer from buf at the specified offset.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('00000000ffffffff', 'hex')
   *   console.log(buf.readBigUInt64BE(0)) // Prints: 4294967295n
   * })()
   * ```
   */
  readBigUInt64BE (offset: number = 0): bigint {
    return this.#dv.getBigUint64(offset)
  }

  /**
   * Alias of {@link Buffer.readBigUInt64BE}.
   * @group Method Aliases
   */
  get readBigUint64BE (): Buffer['readBigUInt64BE'] { return this.readBigUInt64BE }

  /**
   * Reads an unsigned, little-endian 64-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('00000000ffffffff', 'hex')
   *   console.log(buf.readBigUInt64LE(0)) // Prints: 18446744069414584320n
   * })()
   * ```
   */
  readBigUInt64LE (offset: number = 0): bigint {
    return this.#dv.getBigUint64(offset, true)
  }

  /**
   * Alias of {@link Buffer.readBigUInt64LE}.
   * @group Method Aliases
   */
  get readBigUint64LE (): Buffer['readBigUInt64LE'] { return this.readBigUInt64LE }

  /**
   * Reads a 64-bit, big-endian double from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('0102030405060708', 'hex')
   *   console.log(buf.readDoubleBE(0)) // Prints: 8.20788039913184e-304
   * })()
   * ```
   */
  readDoubleBE (offset: number = 0): number {
    return this.#dv.getFloat64(offset)
  }

  /**
   * Reads a 64-bit, little-endian double from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('0102030405060708', 'hex')
   *   console.log(buf.readDoubleLE(0)) // Prints: 5.447603722011605e-270
   * })()
   * ```
   */
  readDoubleLE (offset: number = 0): number {
    return this.#dv.getFloat64(offset, true)
  }

  /**
   * Reads a 32-bit, big-endian float from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('01020304', 'hex')
   *   console.log(buf.readFloatBE(0)) // Prints: 2.387939260590663e-38
   * })()
   * ```
   */
  readFloatBE (offset: number = 0): number {
    return this.#dv.getFloat32(offset)
  }

  /**
   * Reads a 32-bit, little-endian float from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('01020304', 'hex')
   *   console.log(buf.readFloatLE(0)) // Prints: 1.539989614439558e-36
   * })()
   * ```
   */
  readFloatLE (offset: number = 0): number {
    return this.#dv.getFloat32(offset, true)
  }

  /**
   * Reads a signed 8-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([-1, 5])
   *   console.log(buf.readInt8(0)) // Prints: -1
   *   console.log(buf.readInt8(1)) // Prints: 5
   * })()
   * ```
   */
  readInt8 (offset: number = 0): number {
    return this.#dv.getInt8(offset)
  }

  /**
   * Reads a signed, big-endian 16-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0, 5])
   *   console.log(buf.readInt16BE(0)) // Prints: 5
   * })()
   * ```
   */
  readInt16BE (offset: number = 0): number {
    return this.#dv.getInt16(offset)
  }

  /**
   * Reads a signed, little-endian 16-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0, 5])
   *   console.log(buf.readInt16LE(0)) // Prints: 1280
   * })()
   * ```
   */
  readInt16LE (offset: number = 0): number {
    return this.#dv.getInt16(offset, true)
  }

  /**
   * Reads a signed, big-endian 32-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0, 0, 0, 5])
   *   console.log(buf.readInt32BE(0)) // Prints: 5
   * })()
   * ```
   */
  readInt32BE (offset: number = 0): number {
    return this.#dv.getInt32(offset)
  }

  /**
   * Reads a signed, little-endian 32-bit integer from `buf` at the specified `offset`. Integers read from a `Buffer` are interpreted as two's complement signed values.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0, 0, 0, 5])
   *   console.log(buf.readInt32LE(0)) // Prints: 83886080
   * })()
   * ```
   */
  readInt32LE (offset: number = 0): number {
    return this.#dv.getInt32(offset, true)
  }

  /**
   * Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as a big-endian, two's complement signed value supporting up to 48 bits of accuracy.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to read. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab])
   *   console.log(buf.readIntBE(0, 6).toString(16)) // Prints: 1234567890ab
   * })()
   * ```
   */
  readIntBE (offset: number = 0, byteLength: number = 6): number {
    const tmp = this.readUIntBE(offset, byteLength)
    return tmp > SIGNED_MAX_VALUE[byteLength] ? tmp - SIGNED_OFFSET[byteLength] : tmp
  }

  /**
   * Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as a little-endian, two's complement signed value supporting up to 48 bits of accuracy.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to read. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab])
   *   console.log(buf.readIntLE(0, 6).toString(16)) // Prints: -546f87a9cbee
   * })()
   * ```
   */
  readIntLE (offset: number = 0, byteLength: number = 6): number {
    const tmp = this.readUIntLE(offset, byteLength)
    return tmp > SIGNED_MAX_VALUE[byteLength] ? tmp - SIGNED_OFFSET[byteLength] : tmp
  }

  /**
   * Reads an unsigned 8-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([1, -2])
   *   console.log(buf.readUInt8(0)) // Prints: 1
   *   console.log(buf.readUInt8(1)) // Prints: 254
   * })()
   * ```
   */
  readUInt8 (offset: number = 0): number {
    return this.#dv.getUint8(offset)
  }

  /**
   * Alias of {@link Buffer.readUInt8}.
   * @group Method Aliases
   */
  get readUint8 (): Buffer['readUInt8'] { return this.readUInt8 }

  /**
   * Reads an unsigned, big-endian 16-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56])
   *   console.log(buf.readUInt16BE(0).toString(16)) // Prints: 1234
   *   console.log(buf.readUInt16BE(1).toString(16)) // Prints: 3456
   * })()
   * ```
   */
  readUInt16BE (offset: number = 0): number {
    return this.#dv.getUint16(offset)
  }

  /**
   * Alias of {@link Buffer.readUInt16BE}.
   * @group Method Aliases
   */
  get readUint16BE (): Buffer['readUInt16BE'] { return this.readUInt16BE }

  /**
   * Reads an unsigned, little-endian 16-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56])
   *   console.log(buf.readUInt16LE(0).toString(16)) // Prints: 3412
   *   console.log(buf.readUInt16LE(1).toString(16)) // Prints: 5634
   * })()
   * ```
   */
  readUInt16LE (offset: number = 0): number {
    return this.#dv.getUint16(offset, true)
  }

  /**
   * Alias of {@link Buffer.readUInt16LE}.
   * @group Method Aliases
   */
  get readUint16LE (): Buffer['readUInt16LE'] { return this.readUInt16LE }

  /**
   * Reads an unsigned, big-endian 32-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78])
   *   console.log(buf.readUInt32BE(0).toString(16)) // Prints: 12345678
   * })()
   * ```
   */
  readUInt32BE (offset: number = 0): number {
    return this.#dv.getUint32(offset)
  }

  /**
   * Alias of {@link Buffer.readUInt32BE}.
   * @group Method Aliases
   */
  get readUint32BE (): Buffer['readUInt32BE'] { return this.readUInt32BE }

  /**
   * Reads an unsigned, little-endian 32-bit integer from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78])
   *   console.log(buf.readUInt32LE(0).toString(16)) // Prints: 78563412
   * })()
   * ```
   */
  readUInt32LE (offset: number = 0): number {
    return this.#dv.getUint32(offset, true)
  }

  /**
   * Alias of {@link Buffer.readUInt32LE}.
   * @group Method Aliases
   */
  get readUint32LE (): Buffer['readUInt32LE'] { return this.readUInt32LE }

  /**
   * Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as an unsigned big-endian integer supporting up to 48 bits of accuracy.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to read. Must satisfy `0 < byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab])
   *   console.log(buf.readUIntBE(0, 6).toString(16)) // Prints: 1234567890ab
   * })()
   * ```
   */
  readUIntBE (offset: number = 0, byteLength: number = 6): number {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (offset + byteLength > this.length) throw new RangeError(`Invalid offset: ${offset}`)
    let tmp = 0
    for (let i = 0; i < byteLength; i++) tmp = tmp * 0x100 + this[offset + i]
    return tmp
  }

  /**
   * Alias of {@link Buffer.readUIntBE}.
   * @group Method Aliases
   */
  get readUintBE (): Buffer['readUIntBE'] { return this.readUIntBE }

  /**
   * Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as an unsigned big-endian integer supporting up to 48 bits of accuracy.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to read. Must satisfy `0 < byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab])
   *   console.log(buf.readUIntLE(0, 6).toString(16)) // Prints: ab9078563412
   * })()
   * ```
   */
  readUIntLE (offset: number = 0, byteLength: number = 6): number {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (offset + byteLength > this.length) throw new RangeError(`Invalid offset: ${offset}`)
    let tmp = 0
    for (let i = byteLength - 1; i >= 0; i--) tmp = tmp * 0x100 + this[offset + i]
    return tmp
  }

  /**
   * Alias of {@link Buffer.readUIntLE}.
   * @group Method Aliases
   */
  get readUintLE (): Buffer['readUIntLE'] { return this.readUIntLE }

  /**
   * Reads a 16-bit, big-endian float from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.from('0000', 'hex').readFloat16BE(0)) // Prints: 0
   *   console.log(Buffer.from('8000', 'hex').readFloat16BE(0)) // Prints: -0
   *   console.log(Buffer.from('3c00', 'hex').readFloat16BE(0)) // Prints: 1
   *   console.log(Buffer.from('bc00', 'hex').readFloat16BE(0)) // Prints: -1
   *   console.log(Buffer.from('7c00', 'hex').readFloat16BE(0)) // Prints: Infinity
   *   console.log(Buffer.from('fc00', 'hex').readFloat16BE(0)) // Prints: -Infinity
   *   console.log(Buffer.from('7e00', 'hex').readFloat16BE(0)) // Prints: NaN
   *   console.log(Buffer.from('fe00', 'hex').readFloat16BE(0)) // Prints: NaN
   * })()
   * ```
   */
  readFloat16BE (offset: number = 0): number {
    const u32 = floatU16ToU32(this.readUInt16BE(offset))
    float16Buf.setUint32(0, u32)
    return float16Buf.getFloat32(0)
  }

  /**
   * Reads a 16-bit, little-endian float from `buf` at the specified `offset`.
   * @param offset - Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   console.log(Buffer.from('0000', 'hex').readFloat16LE(0)) // Prints: 0
   *   console.log(Buffer.from('0080', 'hex').readFloat16LE(0)) // Prints: -0
   *   console.log(Buffer.from('003c', 'hex').readFloat16LE(0)) // Prints: 1
   *   console.log(Buffer.from('00bc', 'hex').readFloat16LE(0)) // Prints: -1
   *   console.log(Buffer.from('007c', 'hex').readFloat16LE(0)) // Prints: Infinity
   *   console.log(Buffer.from('00fc', 'hex').readFloat16LE(0)) // Prints: -Infinity
   *   console.log(Buffer.from('007e', 'hex').readFloat16LE(0)) // Prints: NaN
   *   console.log(Buffer.from('00fe', 'hex').readFloat16LE(0)) // Prints: NaN
   * })()
   * ```
   */
  readFloat16LE (offset: number = 0): number {
    const u32 = floatU16ToU32(this.readUInt16LE(offset))
    float16Buf.setUint32(0, u32)
    return float16Buf.getFloat32(0)
  }

  /**
   * Treat `buf` as a [most-significant bit](https://en.wikipedia.org/wiki/Most_significant_bit) array and read a bit at the specified bit offset.
   * @param bitOffset - bit offset to read from.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0b10010110])
   *   const bits = new Array(8)
   *   for (let i = 0; i < 8; i++) bits[i] = buf.readBitMSB(i)
   *   console.log(bits) // Prints: [1, 0, 0, 1, 0, 1, 1, 0]
   * })()
   * ```
   */
  readBitMSB (bitOffset: number): number {
    const tmp = [bitOffset >>> 3, (bitOffset & 7) ^ 7]
    return (this[tmp[0]] >>> tmp[1]) & 1
  }

  /**
   * Treat the buffer as a [least significant bit](https://en.wikipedia.org/wiki/Least_significant_bit) array and read a bit at the specified bit offset.
   * @param bitOffset - bit offset to read from.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from([0b10010110])
   *   const bits = new Array(8)
   *   for (let i = 0; i < 8; i++) bits[i] = buf.readBitLSB(i)
   *   console.log(bits) // Prints: [0, 1, 1, 0, 1, 0, 0, 1]
   * })()
   * ```
   */
  readBitLSB (bitOffset: number): number {
    const tmp = [this.length - (bitOffset >>> 3) - 1, bitOffset & 7]
    return (this[tmp[0]] >>> tmp[1]) & 1
  }

  /**
   * Returns a new `Buffer` that references the same memory as the original, but offset and cropped by the `start` and `end` indexes.
   *
   * Specifying `end` greater than `buf.length` will return the same result as that of `end` equal to `buf.length`.
   *
   * Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.
   *
   * Specifying negative indexes causes the slice to be generated relative to the end of `buf` rather than the beginning.
   * @param start - Where the new `Buffer` will start. Default: `0`.
   * @param end - Where the new `Buffer` will end (not inclusive). Default: `buf.length`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.allocUnsafe(26)
   *   for (let i = 0; i < 26; i++) buf1[i] = i + 97
   *
   *   const buf2 = buf1.subarray(0, 3)
   *   console.log(buf2.toString('ascii', 0, buf2.length)) // Prints: abc
   *
   *   buf1[0] = 33
   *   console.log(buf2.toString('ascii', 0, buf2.length)) // Prints: !bc
   * })()
   * ```
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.allocUnsafe(26)
   *   for (let i = 0; i < 26; i++) buf1[i] = i + 97
   *
   *   const buf2 = buf1.subarray(0, 3)
   *   console.log(buf2.toString('ascii', 0, buf2.length)) // Prints: abc
   *
   *   buf1[0] = 33
   *   console.log(buf2.toString('ascii', 0, buf2.length)) // Prints: !bc
   * })()
   * ```
   */
  subarray (start: number = 0, end: number = this.length): Buffer {
    const buf = super.subarray(start, end)
    return new Buffer(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  /**
   * Returns a copy of a portion of a `Buffer` into a new `Buffer` object selected from `start` to `end` (`end` not included) where `start` and `end` represent the index of items in that `buf`. The original `Buffer` will not be modified.
   * @param start - Where the new `Buffer` will start. Default: `0`.
   * @param end - Where the new `Buffer` will end (not inclusive). Default: `buf.length`.
   * @remarks This method is different from Node.js's `Buffer.slice()` method.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('1020304050', 'hex')
   *   const buf2 = buf1.slice(1, 3)
   *   buf1[1] = 0x60
   *   console.log(buf1.toString('hex')) // Prints: 1060304050
   *   console.log(buf2.toString('hex')) // Prints: 2030
   * })()
   * ```
   */
  slice (start: number = 0, end: number = this.length): Buffer {
    return new Buffer(super.slice(start, end).buffer)
  }

  /**
   * Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order in-place.
   * @returns A reference to `buf`.
   * @throws If `buf.length` is not a multiple of 2, this method will throw a `RangeError`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('0102030405060708', 'hex')
   *   console.log(buf1.toString('hex')) // Prints: 0102030405060708
   *   buf1.swap16()
   *   console.log(buf1.toString('hex')) // Prints: 0201040306050807
   *
   *   const utf16 = Buffer.from('This is little-endian UTF-16', 'utf16le')
   *   utf16.swap16() // Convert to big-endian UTF-16 text.
   * })()
   * ```
   */
  swap16 (): this {
    if ((this.length & 0x1) > 0) throw new RangeError('Buffer size must be a multiple of 16-bits')
    for (let i = 0; i < this.length; i += 2) this.writeUInt16LE(this.readUInt16BE(i), i)
    return this
  }

  /**
   * Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order in-place.
   * @returns A reference to `buf`.
   * @throws If `buf.length` is not a multiple of 4, this method will throw a `RangeError`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('0102030405060708', 'hex')
   *   console.log(buf1.toString('hex')) // Prints: 0102030405060708
   *   buf1.swap32()
   *   console.log(buf1.toString('hex')) // Prints: 0403020108070605
   * })()
   * ```
   */
  swap32 (): this {
    if ((this.length & 0x3) > 0) throw new RangeError('Buffer size must be a multiple of 32-bits')
    for (let i = 0; i < this.length; i += 4) this.writeUInt32LE(this.readUInt32BE(i), i)
    return this
  }

  /**
   * Interprets `buf` as an array of unsigned 64-bit integers and swaps the byte order in-place.
   * @returns A reference to `buf`.
   * @throws If `buf.length` is not a multiple of 8, this method will throw a `RangeError`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('0102030405060708', 'hex')
   *   console.log(buf1.toString('hex')) // Prints: 0102030405060708
   *   buf1.swap64()
   *   console.log(buf1.toString('hex')) // Prints: 0807060504030201
   * })()
   * ```
   */
  swap64 (): this {
    if ((this.length & 0x7) > 0) throw new RangeError('Buffer size must be a multiple of 64-bits')
    for (let i = 0; i < this.length; i += 8) this.writeBigUInt64LE(this.readBigUInt64BE(i), i)
    return this
  }

  /**
   * `JSON.stringify()` implicitly calls this method when stringifying a `Buffer` instance. `Buffer.from()` accepts objects in the format returned from this method. In particular, `Buffer.from(buf.toJSON())` works like `Buffer.from(buf)`.
   * @returns a JSON representation of `buf`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('0102030405', 'hex')
   *   const json = JSON.stringify(buf)
   *   console.log(json) // Prints: {"type":"Buffer","data":[1,2,3,4,5]}
   *
   *   const restored = JSON.parse(json, (key, value) => {
   *     return value && value.type === 'Buffer' ? Buffer.from(value) : value
   *   })
   *   console.log(restored.toString('hex')) // Prints: 0102030405
   * })()
   * ```
   */
  toJSON (): { type: 'Buffer', data: number[] } {
    return { type: 'Buffer', data: [...this] }
  }

  /**
   * Decodes `buf` to a string according to the specified character encoding in `encoding`. `start` and `end` may be passed to decode only a subset of `buf`.
   * @param encoding - The character encoding to use. Default: `'utf8'`.
   * @param start - The byte offset to start decoding at. Default: `0`.
   * @param end - The byte offset to stop decoding at (not inclusive). Default: `buf.length`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.allocUnsafe(26)
   *   for (let i = 0; i < 26; i++) buf1[i] = i + 97 // 97 is the decimal ASCII value for 'a'.
   *
   *   console.log(buf1.toString('utf8')) // Prints: abcdefghijklmnopqrstuvwxyz
   *   console.log(buf1.toString('utf8', 0, 5)) // Prints: abcde
   *
   *   const buf2 = Buffer.from('tést')
   *   console.log(buf2.toString('hex')) // Prints: 74c3a97374
   *   console.log(buf2.toString('utf8', 0, 3)) // Prints: té
   *   console.log(buf2.toString(undefined, 0, 3)) // Prints: té
   * })()
   * ```
   */
  toString (encoding: KeyOfEncoding = 'utf8', start: number = 0, end: number = this.length): string {
    encoding = _.toLower(encoding) as KeyOfEncoding
    if (!Buffer.isEncoding(encoding)) throw new TypeError(`Unknown encoding: ${encoding as string}`)
    return Buffer[toStringFns[encoding]](this.subarray(start, end))
  }

  /**
   * Custom inspect functions which `util.inspect()` will invoke and use the result of when inspecting the object.
   * @returns a string representation of `buf`.
   */
  [customInspectSymbol] (): string {
    const tmp = this.subarray(0, INSPECT_MAX_BYTES).toString('hex').match(/.{2}/g) as string[]
    const strMoreBytes = this.length > INSPECT_MAX_BYTES ? ` ... ${this.length - INSPECT_MAX_BYTES} more bytes` : ''
    return `<Buffer ${tmp.join(' ')}${strMoreBytes}>`
  }

  /**
   * Creates a new `Buffer` which is reverse of the original `buf`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('01020304', 'hex')
   *   const buf2 = buf1.reverse()
   *   console.log(buf1.toString('hex')) // Prints: 01020304
   *   console.log(buf2.toString('hex')) // Prints: 04030201
   * })()
   * ```
   */
  reverse (): Buffer {
    const buf = new Buffer(this.length)
    for (let i = buf.length - 1; i >= 0; i--) buf[i] = this[this.length - i - 1]
    return buf
  }

  /**
   * Decodes `buf` to a string according to the UCS-2 character encoding.
   * @param buf - The buffer to decode.
   * @group Static Methods
   */
  static toUcs2String (buf: Buffer): string {
    return new TextDecoder('utf-16le').decode(buf)
  }

  /**
   * Decodes `buf` to a string according to the UTF-8 character encoding.
   * @param buf - The buffer to decode.
   * @see This method based on the [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode) API.
   * @group Static Methods
   */
  static toUtf8String (buf: Buffer): string {
    return new TextDecoder().decode(buf)
  }

  /**
   * Decodes `buf` to a string according to the Latin1 character encoding. When decoding a `Buffer` into a string, using this encoding will additionally unset the highest bit of each byte before decoding as `'latin1'`. Generally, there should be no reason to use this encoding, as 'utf8' (or, if the data is known to always be ASCII-only, `'latin1'`) will be a better choice when encoding or decoding ASCII-only text. It is only provided for legacy compatibility.
   * @param buf - The buffer to decode.
   * @group Static Methods
   */
  static toLatin1String (buf: Buffer): string {
    const arr = []
    for (let i = 0; i < buf.length; i++) arr.push(String.fromCharCode(buf[i]))
    return arr.join('')
  }

  /**
   * Decodes `buf` to a string according to the Base64 character encoding.
   * @param buf - The buffer to decode.
   * @group Static Methods
   */
  static toBase64String (buf: Buffer): string {
    const arr = []
    for (let i = 0; i < buf.length; i += 3) {
      const u24 = (buf[i] << 16) +
        ((i + 1 < buf.length ? buf[i + 1] : 0) << 8) +
        (i + 2 < buf.length ? buf[i + 2] : 0)
      arr.push(...[
        CHARCODE_BASE64.get(u24 >>> 18 & 0x3F),
        CHARCODE_BASE64.get(u24 >>> 12 & 0x3F),
        CHARCODE_BASE64.get(u24 >>> 6 & 0x3F),
        CHARCODE_BASE64.get(u24 >>> 0 & 0x3F),
      ])
    }
    const tmp = arr.length + (buf.length + 2) % 3 - 2
    for (let i = tmp; i < arr.length; i++) arr[i] = '='
    return arr.join('')
  }

  /**
   * Decodes `buf` to a string according to the Base64 URL character encoding.
   * @param buf - The buffer to decode.
   * @group Static Methods
   */
  static toBase64urlString (buf: Buffer): string {
    const arr = []
    for (let i = 0; i < buf.length; i += 3) {
      const u24 = (buf[i] << 16) + ((buf[i + 1] ?? 0) << 8) + (buf[i + 2] ?? 0)
      arr.push(...[
        CHARCODE_BASE64URL.get(u24 >>> 18 & 0x3F),
        CHARCODE_BASE64URL.get(u24 >>> 12 & 0x3F),
        CHARCODE_BASE64URL.get(u24 >>> 6 & 0x3F),
        CHARCODE_BASE64URL.get(u24 >>> 0 & 0x3F),
      ])
    }
    const tmp = (buf.length + 2) % 3 - 2
    return (tmp !== 0 ? arr.slice(0, tmp) : arr).join('')
  }

  /**
   * Decodes `buf` to a string according to the hexadecimal character encoding.
   * @param buf - The buffer to decode.
   * @group Static Methods
   */
  static toHexString (buf: Buffer): string {
    const arr = []
    for (let i = 0; i < buf.length; i++) arr.push(CHARCODE_HEX.get(buf[i] >>> 4), CHARCODE_HEX.get(buf[i] & 0xF))
    return arr.join('')
  }

  write (string: string, encoding?: KeyOfEncoding): number
  write (string: string, offset: number, encoding?: KeyOfEncoding): number

  /**
   * Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. The `length` parameter is the number of bytes to write. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. However, partially encoded characters will not be written.
   * @param string - String to write to `buf`.
   * @param offset - Number of bytes to skip before starting to write `string`. Default: `0`.
   * @param length - Maximum number of bytes to write (written bytes will not exceed `buf.length - offset`). Default: `buf.length - offset`.
   * @param encoding - The character encoding of `string`. Default: `'utf8'`.
   * @returns Number of bytes written.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.alloc(256)
   *   const len1 = buf1.write('\u00bd + \u00bc = \u00be', 0)
   *   console.log(`${len1} bytes: ${buf1.toString('utf8', 0, len1)}`)
   *   // Prints: 12 bytes: ½ + ¼ = ¾
   *
   *   const buf2 = Buffer.alloc(10)
   *   const len2 = buf2.write('abcd', 8)
   *   console.log(`${len2} bytes: ${buf2.toString('utf8', 8, 10)}`)
   *   // Prints: 2 bytes : ab
   * })()
   * ```
   */
  write (string: string, offset: number, length: number, encoding?: KeyOfEncoding): number

  /**
   * Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. The `length` parameter is the number of bytes to write. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. However, partially encoded characters will not be written.
   * @param string - String to write to `buf`.
   * @param offset - Number of bytes to skip before starting to write `string`. Default: `0`.
   * @param length - Maximum number of bytes to write (written bytes will not exceed `buf.length - offset`). Default: `buf.length - offset`.
   * @param encoding - The character encoding of `string`. Default: `'utf8'`.
   * @returns Number of bytes written.
   */
  write (string: any, offset: any = 0, length: any = this.length - offset, encoding: any = 'utf8'): number {
    if (_.isString(offset)) [offset, length, encoding] = [0, this.length, offset]
    else if (_.isString(length)) [length, encoding] = [this.length - offset, length]

    if (!_.isString(string)) throw new TypeError('Invalid type of val')
    if (!_.isSafeInteger(offset)) throw new TypeError('Invalid type of offset')
    if (!_.isSafeInteger(length)) throw new TypeError('Invalid type of length')
    if (!Buffer.isEncoding(encoding)) throw new TypeError(`Unknown encoding: ${encoding as string}`)

    const buf = Buffer.fromString(string, encoding)
    length = Math.min(buf.length, length, this.length - offset)
    this.set(buf.subarray(0, length), offset)
    return length
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeBigInt64BE(0x0102030405060708n, 0)
   *   console.log(buf.toString('hex')) // Prints: 0102030405060708
   * })()
   * ```
   */
  writeBigInt64BE (val: bigint, offset: number = 0): this {
    this.#dv.setBigInt64(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeBigInt64LE(0x0102030405060708n, 0)
   *   console.log(buf.toString('hex')) // Prints: 0807060504030201
   * })()
   * ```
   */
  writeBigInt64LE (val: bigint, offset: number = 0): this {
    this.#dv.setBigInt64(offset, val, true)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeBigUInt64BE(0xdecafafecacefaden, 0)
   *   console.log(buf.toString('hex')) // Prints: decafafecacefade
   * })()
   * ```
   */
  writeBigUInt64BE (val: bigint, offset: number = 0): this {
    this.#dv.setBigUint64(offset, val)
    return this
  }

  /**
   * Alias of {@link Buffer.writeBigUInt64BE}.
   * @group Method Aliases
   */
  get writeBigUint64BE (): Buffer['writeBigUInt64BE'] { return this.writeBigUInt64BE }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeBigUInt64LE(0xdecafafecacefaden, 0)
   *   console.log(buf.toString('hex')) // Prints: defacecafefacade
   * })()
   * ```
   */
  writeBigUInt64LE (val: bigint, offset: number = 0): this {
    this.#dv.setBigUint64(offset, val, true)
    return this
  }

  /**
   * Alias of {@link Buffer.writeBigUInt64LE}.
   * @group Method Aliases
   */
  get writeBigUint64LE (): Buffer['writeBigUInt64LE'] { return this.writeBigUInt64LE }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeDoubleBE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: 405edd2f1a9fbe77
   * })()
   * ```
   */
  writeDoubleBE (val: number, offset: number = 0): this {
    this.#dv.setFloat64(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 8`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(8)
   *   buf.writeDoubleLE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: 77be9f1a2fdd5e40
   * })()
   * ```
   */
  writeDoubleLE (val: number, offset: number = 0): this {
    this.#dv.setFloat64(offset, val, true)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeFloatBE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: 42f6e979
   * })()
   * ```
   */
  writeFloatBE (val: number, offset: number = 0): this {
    this.#dv.setFloat32(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeFloatLE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: 79e9f642
   * })()
   * ```
   */
  writeFloatLE (val: number, offset: number = 0): this {
    this.#dv.setFloat32(offset, val, true)
    return this
  }

  /**
   * Writes a 16-bit float `value` to `buf` at the specified `offset` as big-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   buf.writeFloat16BE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: 57b7
   * })()
   * ```
   */
  writeFloat16BE (val: number, offset: number = 0): this {
    float16Buf.setFloat32(0, val)
    const u32 = float16Buf.getUint32(0)
    return this.writeUInt16BE(floatU32ToU16(u32), offset)
  }

  /**
   * Writes a 16-bit float `value` to `buf` at the specified `offset` as little-endian. The `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   buf.writeFloat16LE(123.456, 0)
   *   console.log(buf.toString('hex')) // Prints: b757
   * })()
   * ```
   */
  writeFloat16LE (val: number, offset: number = 0): this {
    float16Buf.setFloat32(0, val)
    const u32 = float16Buf.getUint32(0)
    return this.writeUInt16LE(floatU32ToU16(u32), offset)
  }

  /**
   * Writes `value` to `buf` at the specified `offset`. `value` must be a valid signed 8-bit integer. Behavior is undefined when `value` is anything other than a signed 8-bit integer. `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 1`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   buf.writeInt8(2, 0)
   *   buf.writeInt8(-2, 1)
   *   console.log(buf.toString('hex')) // Prints: 02fe
   * })()
   * ```
   */
  writeInt8 (val: number, offset: number = 0): this {
    this.#dv.setInt8(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The value must be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer. The `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   buf.writeInt16BE(0x0102, 0)
   *   console.log(buf.toString('hex')) // Prints: 0102
   * })()
   * ```
   */
  writeInt16BE (val: number, offset: number = 0): this {
    this.#dv.setInt16(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The value must be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer. The `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(2)
   *   buf.writeInt16LE(0x0102, 0)
   *   console.log(buf.toString('hex')) // Prints: 0201
   * })()
   * ```
   */
  writeInt16LE (val: number, offset: number = 0): this {
    this.#dv.setInt16(offset, val, true)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The value must be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer. The `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeInt32BE(0x01020304, 0)
   *   console.log(buf.toString('hex')) // Prints: 01020304
   * })()
   * ```
   */
  writeInt32BE (val: number, offset: number = 0): this {
    this.#dv.setInt32(offset, val)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The value must be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer. The `value` is interpreted and written as a two's complement signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy: `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeInt32LE(0x01020304, 0)
   *   console.log(buf.toString('hex')) // Prints: 04030201
   * })()
   * ```
   */
  writeInt32LE (val: number, offset: number = 0): this {
    this.#dv.setInt32(offset, val, true)
    return this
  }

  /**
   * Writes `byteLength` bytes of `value` to `buf` at the specified `offset` as big-endian. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than a signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to write. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(6)
   *   buf.writeIntBE(0x1234567890ab, 0, 6)
   *   console.log(buf.toString('hex')) // Prints: 1234567890ab
   * })()
   * ```
   */
  writeIntBE (val: number, offset: number = 0, byteLength: number = 6): this {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (val < 0) val += SIGNED_OFFSET[byteLength]
    this.writeUIntBE(val, offset, byteLength)
    return this
  }

  /**
   * Writes `byteLength` bytes of `value` to `buf` at the specified `offset` as little-endian. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than a signed integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to write. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(6)
   *   buf.writeIntLE(0x1234567890ab, 0, 6)
   *   console.log(buf.toString('hex')) // Prints: ab9078563412
   * })()
   * ```
   */
  writeIntLE (val: number, offset: number = 0, byteLength: number = 6): this {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (val < 0) val += SIGNED_OFFSET[byteLength]
    this.writeUIntLE(val, offset, byteLength)
    return this
  }

  /**
   * Writes `value` to `buf` at the specified `offset`. `value` must be a valid unsigned 8-bit integer. Behavior is undefined when `value` is anything other than an unsigned 8-bit integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 1`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeUInt8(0x3, 0)
   *   buf.writeUInt8(0x4, 1)
   *   buf.writeUInt8(0x23, 2)
   *   buf.writeUInt8(0x42, 3)
   *   console.log(buf.toString('hex')) // Prints: 03042342
   * })()
   * ```
   */
  writeUInt8 (val: number, offset: number = 0): this {
    this.#dv.setUint8(offset, val)
    return this
  }

  /**
   * Alias of {@link Buffer.writeUInt8}.
   * @group Method Aliases
   */
  get writeUint8 (): Buffer['writeUInt8'] { return this.writeUInt8 }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The `value` must be a valid unsigned 16-bit integer. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeUInt16BE(0xdead, 0)
   *   buf.writeUInt16BE(0xbeef, 2)
   *   console.log(buf.toString('hex')) // Prints: deadbeef
   * })()
   * ```
   */
  writeUInt16BE (val: number, offset: number = 0): this {
    this.#dv.setUint16(offset, val)
    return this
  }

  /**
   * Alias of {@link Buffer.writeUInt16BE}.
   * @group Method Aliases
   */
  get writeUint16BE (): Buffer['writeUInt16BE'] { return this.writeUInt16BE }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The `value` must be a valid unsigned 16-bit integer. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeUInt16LE(0xdead, 0)
   *   buf.writeUInt16LE(0xbeef, 2)
   *   console.log(buf.toString('hex')) // Prints: addeefbe
   * })()
   * ```
   */
  writeUInt16LE (val: number, offset: number = 0): this {
    this.#dv.setUint16(offset, val, true)
    return this
  }

  /**
   * Alias of {@link Buffer.writeUInt16LE}.
   * @group Method Aliases
   */
  get writeUint16LE (): Buffer['writeUInt16LE'] { return this.writeUInt16LE }

  /**
   * Writes `value` to `buf` at the specified `offset` as big-endian. The `value` must be a valid unsigned 32-bit integer. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeUInt32BE(0xfeedface, 0)
   *   console.log(buf.toString('hex')) // Prints: feedface
   * })()
   * ```
   */
  writeUInt32BE (val: number, offset: number = 0): this {
    this.#dv.setUint32(offset, val)
    return this
  }

  /**
   * Alias of {@link Buffer.writeUInt32BE}.
   * @group Method Aliases
   */
  get writeUint32BE (): Buffer['writeUInt32BE'] { return this.writeUInt32BE }

  /**
   * Writes `value` to `buf` at the specified `offset` as little-endian. The `value` must be a valid unsigned 32-bit integer. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`. Default: `0`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(4)
   *   buf.writeUInt32LE(0xfeedface, 0)
   *   console.log(buf.toString('hex')) // Prints: cefaedfe
   * })()
   * ```
   */
  writeUInt32LE (val: number, offset: number = 0): this {
    this.#dv.setUint32(offset, val, true)
    return this
  }

  /**
   * Alias of {@link Buffer.writeUInt32LE}.
   * @group Method Aliases
   */
  get writeUint32LE (): Buffer['writeUInt32LE'] { return this.writeUInt32LE }

  /**
   * Writes `byteLength` bytes of `value` to `buf` at the specified `offset` as big-endian. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than an unsigned integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to write. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(6)
   *   buf.writeUIntBE(0x1234567890ab, 0, 6)
   *   console.log(buf.toString('hex')) // Prints: 1234567890ab
   * })()
   * ```
   */
  writeUIntBE (val: number, offset: number = 0, byteLength: number = 6): this {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (offset + byteLength > this.length) throw new RangeError(`Invalid offset: ${offset}`)
    for (let i = byteLength - 1; i >= 0; i--) {
      this[offset + i] = val & 0xFF
      val /= 0x100
    }
    return this
  }

  /**
   * Alias of {@link Buffer.writeUIntBE}.
   * @group Method Aliases
   */
  get writeUintBE (): Buffer['writeUIntBE'] { return this.writeUIntBE }

  /**
   * Writes `byteLength` bytes of `value` to `buf` at the specified `offset` as little-endian. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than an unsigned integer.
   * @param val - Number to be written to `buf`.
   * @param offset - Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
   * @param byteLength - Number of bytes to write. Must satisfy `1 <= byteLength <= 6`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(6)
   *   buf.writeUIntLE(0x1234567890ab, 0, 6)
   *   console.log(buf.toString('hex')) // Prints: ab9078563412
   * })()
   * ```
   */
  writeUIntLE (val: number, offset: number = 0, byteLength: number = 6): this {
    if (byteLength < 1 || byteLength > 6) throw new RangeError(`Invalid byteLength: ${byteLength}`)
    if (offset + byteLength > this.length) throw new RangeError(`Invalid offset: ${offset}`)
    for (let i = 0; i < byteLength; i++) {
      this[offset + i] = val & 0xFF
      val /= 0x100
    }
    return this
  }

  /**
   * Alias of {@link Buffer.writeUIntLE}.
   * @group Method Aliases
   */
  get writeUintLE (): Buffer['writeUIntLE'] { return this.writeUIntLE }

  /**
   * Treats `buf` as a [most-significant bit](https://en.wikipedia.org/wiki/Most_significant_bit) array and write a bit at the specified bit offset.
   * @param val - Bit value to write.
   * @param bitOffset - bit offset to read from.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(1)
   *   const bits = [1, 0, 0, 1, 0, 1, 1, 0]
   *   for (let i = 0; i < 8; i++) buf.writeBitMSB(bits[i], i)
   *   console.log(buf[0].toString(2)) // Prints: 10010110
   * })()
   * ```
   */
  writeBitMSB (val: number | boolean, bitOffset: number): this {
    const tmp = [bitOffset >>> 3, (bitOffset & 7) ^ 7]
    if (val) this[tmp[0]] |= 1 << tmp[1]
    else this[tmp[0]] &= ~(1 << tmp[1])
    return this
  }

  /**
   * Treats `buf` as a [least significant bit](https://en.wikipedia.org/wiki/Least_significant_bit) array and write a bit at the specified bit offset.
   * @param val - Bit value to write.
   * @param bitOffset - bit offset to read from.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = new Buffer(1)
   *   const bits = [0, 1, 1, 0, 1, 0, 0, 1]
   *   for (let i = 0; i < 8; i++) buf.writeBitLSB(bits[i], i)
   *   console.log(buf[0].toString(2)) // Prints: 10010110
   * })()
   * ```
   */
  writeBitLSB (val: number | boolean, bitOffset: number): this {
    const tmp = [this.length - (bitOffset >>> 3) - 1, bitOffset & 7]
    if (val) this[tmp[0]] |= 1 << tmp[1]
    else this[tmp[0]] &= ~(1 << tmp[1])
    return this
  }

  /**
   * Creates an array of chunk `Buffer`s which length is `bytesPerChunk`. If `buf`'s contents can't be split evenly, the final chunk will be the remaining contents.
   * @param bytesPerChunk - The length of each chunk
   * @returns The new array of chunks.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('010203040506070809', 'hex')
   *   console.log(buf.chunk(4).map(chunk => chunk.toString('hex')))
   *   // Prints: ['01020304', '05060708', '09']
   * })()
   * ```
   */
  chunk (bytesPerChunk: number): Buffer[] {
    if (bytesPerChunk < 1) throw new TypeError('invalid bytesPerChunk')
    const chunks = []
    for (let i = 0; i < this.length; i += bytesPerChunk) chunks.push(this.subarray(i, i + bytesPerChunk))
    return chunks
  }

  /**
   * Calculates the xor of all bytes in `buf`. If `buf` is empty, returns `0`. You can use `buf.subarray()` to calculate the xor of a subset of `buf`. Xor is usually used to calculate checksums in serial communication.
   * @returns The xor of all bytes in `buf`.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf = Buffer.from('010203040506070809', 'hex')
   *   console.log(buf.xor()) // Prints: 1
   * })()
   * ```
   */
  xor (): number {
    let xor = 0
    for (const v of this) xor ^= v
    return xor
  }

  /**
   * Pack `vals` into `buf` according to the format string `format`. The arguments must match the `vals` required by the `format` exactly. The `buf`’s size in bytes must larger then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param format - A format string.
   * @param vals - Values to pack.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.alloc(3)
   *   buf1.pack('>h', 0x0102)
   *   console.log(buf1.toString('hex')) // Prints: 010200
   *
   *   const buf2 = Buffer.alloc(3)
   *   buf2.subarray(1).pack('>h', 0x0102) // struct.pack_into
   *   console.log(buf2.toString('hex')) // Prints: 000102
   * })()
   * ```
   */
  pack (format: string, ...vals: any[]): this {
    Buffer.pack(this, format, ...vals)
    return this
  }

  /**
   * Unpack from the `buf` (presumably packed by `pack(format, ...))` according to the format string `format`. The result is a tuple even if it contains exactly one item. The `buf`’s size in bytes must larger then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param format - A format string.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('01fe01fe', 'hex')
   *   console.log(buf1.unpack('!BBbb')) // Prints: [1, 254, 1, -2]
   * })()
   * ```
   */
  unpack <T extends any[]> (format: string): T {
    return Buffer.unpack<T>(this, format)
  }

  /**
   * Iteratively unpack from the `buf` according to the format string `format`. This method returns an iterator which will read equally sized chunks from the `buf` until remaining contents smaller then the size required by the `format`, as reflected by `Buffer.packCalcSize()`.
   * @param format - A format string.
   * @remarks Unlike Python struct, this method does not support native size and alignment (that wouldn't make much sense in a javascript). Instead, specify byte order and emit pad bytes explicitly.
   * @example
   * ```js
   * ;(async function () {
   *   const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
   *
   *   const buf1 = Buffer.from('01fe01fe', 'hex')
   *   console.log([...buf1.iterUnpack('!BB')]) // Prints: [[1, 254], [1, 254]]
   * })()
   * ```
   */
  * iterUnpack <T extends any[]> (format: string): Generator<T> {
    yield * Buffer.iterUnpack<T>(this, format)
  }
}

interface PackFromContext {
  buf: Buffer
  littleEndian: boolean
  offset: number
  repeat: number
  type: string
  vals: any[]
}

function packFromPad (ctx: PackFromContext): void {
  const { buf, repeat } = ctx
  for (let i = 0; i < repeat; i++) buf[ctx.offset] = 0
  ctx.offset += repeat
}

function unpackToPad (ctx: PackFromContext): void {
  const { repeat } = ctx
  ctx.offset += repeat
}

function packFromChar (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[ctx.offset] = Buffer.from(vals.shift())?.[0] ?? 0
    ctx.offset += 1
  }
}

function unpackToChar (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  for (let i = 0; i < repeat; i++) {
    vals.push(buf.subarray(ctx.offset, ctx.offset + 1))
    ctx.offset += 1
  }
}

function packFromInt8 (ctx: PackFromContext): void {
  const { buf, repeat, type, vals } = ctx
  const fnName = type === 'b' ? 'writeInt8' : 'writeUInt8'
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](_.toSafeInteger(vals.shift()), ctx.offset)
    ctx.offset += 1
  }
}

function unpackToInt8 (ctx: PackFromContext): void {
  const { buf, repeat, type, vals } = ctx
  const fnName = type === 'b' ? 'readInt8' : 'readUInt8'
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 1
  }
}

function packFromBool (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf.writeUInt8(vals.shift() ? 1 : 0, ctx.offset)
    ctx.offset += 1
  }
}

function unpackToBool (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  for (let i = 0; i < repeat; i++) {
    vals.push(buf.readUInt8(ctx.offset) !== 0)
    ctx.offset += 1
  }
}

function packFromInt16 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['writeUInt16BE', 'writeUInt16LE', 'writeInt16BE', 'writeInt16LE'] as const)[(type === 'h' ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](_.toSafeInteger(vals.shift()), ctx.offset)
    ctx.offset += 2
  }
}

function unpackToInt16 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['readUInt16BE', 'readUInt16LE', 'readInt16BE', 'readInt16LE'] as const)[(type === 'h' ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 2
  }
}

function packFromInt32 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['writeUInt32BE', 'writeUInt32LE', 'writeInt32BE', 'writeInt32LE'] as const)[('il'.includes(type) ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](_.toSafeInteger(vals.shift()), ctx.offset)
    ctx.offset += 4
  }
}

function unpackToInt32 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['readUInt32BE', 'readUInt32LE', 'readInt32BE', 'readInt32LE'] as const)[('il'.includes(type) ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 4
  }
}

function packFromBigInt64 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['writeBigUInt64BE', 'writeBigUInt64LE', 'writeBigInt64BE', 'writeBigInt64LE'] as const)[(type === 'q' ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](BigInt(vals.shift()), ctx.offset)
    ctx.offset += 8
  }
}

function unpackToBigInt64 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, type, vals } = ctx
  const fnName = (['readBigUInt64BE', 'readBigUInt64LE', 'readBigInt64BE', 'readBigInt64LE'] as const)[(type === 'q' ? 2 : 0) + (littleEndian ? 1 : 0)]
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 8
  }
}

function packFromFloat16 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'writeFloat16LE' : 'writeFloat16BE'
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](vals.shift(), ctx.offset)
    ctx.offset += 2
  }
}

function unpackToFloat16 (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'readFloat16LE' : 'readFloat16BE'
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 2
  }
}

function packFromFloat (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'writeFloatLE' : 'writeFloatBE'
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](vals.shift(), ctx.offset)
    ctx.offset += 4
  }
}

function unpackToFloat (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'readFloatLE' : 'readFloatBE'
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 4
  }
}

function packFromDouble (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'writeDoubleLE' : 'writeDoubleBE'
  for (let i = 0; i < repeat; i++) {
    if (vals.length === 0) throw new TypeError('Not enough vals')
    buf[fnName](vals.shift(), ctx.offset)
    ctx.offset += 8
  }
}

function unpackToDouble (ctx: PackFromContext): void {
  const { buf, littleEndian, repeat, vals } = ctx
  const fnName = littleEndian ? 'readDoubleLE' : 'readDoubleBE'
  for (let i = 0; i < repeat; i++) {
    vals.push(buf[fnName](ctx.offset))
    ctx.offset += 8
  }
}

function packFromString (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  if (vals.length === 0) throw new TypeError('Not enough vals')
  const val = vals.shift()
  const buf1 = new Buffer(repeat)
  Buffer.from(val).copy(buf1, 0, 0, repeat) // padded with null bytes
  buf1.copy(buf, ctx.offset)
  ctx.offset += buf1.length
}

function unpackToString (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  vals.push(buf.subarray(ctx.offset, ctx.offset + repeat))
  ctx.offset += repeat
}

function packFromPascal (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  if (vals.length === 0) throw new TypeError('Not enough vals')
  const val = vals.shift()
  const buf1 = new Buffer(repeat)
  buf1[0] = Buffer.from(val).copy(buf1, 1, 0, repeat - 1) // padded with null bytes
  buf1.copy(buf, ctx.offset)
  ctx.offset += buf1.length
}

function unpackToPascal (ctx: PackFromContext): void {
  const { buf, repeat, vals } = ctx
  const len = Math.min(buf[ctx.offset], repeat - 1)
  vals.push(buf.subarray(ctx.offset + 1, ctx.offset + 1 + len))
  ctx.offset += repeat
}

interface ArrayLike<T> {
  readonly length: number
  readonly [n: number]: T
}

interface PackFormat {
  littleEndian: boolean
  items: Array<[number, string]>
}

interface CharCodeMap {
  set: ((key: string, val: number) => this) & ((key: number, val: string) => this)
  get: ((key: string) => number) & ((key: number) => string)
}

function initCharCodeMap (map: CharCodeMap, str: string, offset: number = 0): void {
  for (let i = 0; i < str.length; i++) map.set(i + offset, str[i]).set(str[i], i + offset)
}

function isInstance<T> (obj: any, type: Class<T>): obj is T {
  return obj instanceof type || obj?.constructor?.name === type?.name
}

function isSharedArrayBuffer (val: any): val is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== 'undefined' && (isInstance(val, SharedArrayBuffer) || isInstance(val?.buffer, SharedArrayBuffer))
}

function isIterable <T> (val: any): val is Iterable<T> {
  return typeof val?.[Symbol.iterator] === 'function'
}

function floatU32ToU16 (u32: number): number {
  // Float32: 1 + 8 + 23, bits = 1 xxxxxxxx 11111111110000000000000
  //                  0x7FFFFF = 0 00000000 11111111111111111111111
  // Float16: 1 + 5 + 10, bits = 1    xxxxx 1111111111
  //                    0x0200 = 0    00000 1000000000
  //                    0x03FF = 0    00000 1111111111
  //                    0x7C00 = 0    11111 0000000000
  //                    0x8000 = 1    00000 0000000000
  const exp = (u32 >>> 23) & 0xFF
  if (exp === 0xFF) return ((u32 >>> 16) & 0x8000) + 0x7C00 + ((u32 & 0x7FFFFF) !== 0 ? 0x200 : 0) // +-inf / NaN
  if (exp === 0) return ((u32 >>> 16) & 0x8000) + ((u32 >>> 13) & 0x3FF)
  return ((u32 >>> 16) & 0x8000) + (((exp - 112) << 10) & 0x7C00) + ((u32 >>> 13) & 0x3FF)
}

function floatU16ToU32 (u16: number): number {
  // Float32: 1 + 8 + 23, bits = 1 xxxxxxxx 11111111110000000000000
  //                0x00400000 = 0 00000000 10000000000000000000000
  //                0x007FE000 = 0 00000000 11111111110000000000000
  //                0x7F800000 = 0 11111111 00000000000000000000000
  //                0x80000000 = 1 00000000 00000000000000000000000
  // Float16: 1 + 5 + 10, bits = 1    xxxxx 1111111111
  //                    0x03FF = 0    00000 1111111111
  const exp = (u16 >>> 10) & 0x1F
  if (exp === 0x1F) return ((u16 << 16) & 0x80000000) + 0x7F800000 + ((u16 & 0x3FF) !== 0 ? 0x400000 : 0) // +-inf / NaN
  if (exp === 0) return ((u16 << 16) & 0x80000000) + ((u16 << 13) & 0x7FE000)
  return ((u16 << 16) & 0x80000000) + (((exp + 112) << 23) & 0x7F800000) + ((u16 << 13) & 0x7FE000)
}

enum Encoding {
  'ucs-2' = 'ucs-2',
  'utf-16le' = 'utf-16le',
  'utf-8' = 'utf-8',
  ascii = 'ascii',
  base64 = 'base64',
  base64url = 'base64url',
  binary = 'binary',
  hex = 'hex',
  latin1 = 'latin1',
  ucs2 = 'ucs2',
  utf16le = 'utf16le',
  utf8 = 'utf8'
}
type KeyOfEncoding = keyof typeof Encoding

type Class<T> = new (...args: any[]) => T

/**
 * Alias for T or an object supporting `valueOf: () => T`.
 * @typeParam T - The type of the value.
 */
type OrValueOf<T> = T | { valueOf: () => T }
