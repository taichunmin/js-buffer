import * as _ from 'lodash-es'
import util from 'node:util'
import { describe, expect, test, vi } from 'vitest'
import { Buffer } from './buffer'

describe('new Buffer', () => {
  test('0 arguments', () => {
    const actual = new Buffer()
    expect(actual.length).toEqual(0)
  })

  test('1 arguments', () => {
    const actual = new Buffer(10)
    expect(actual.length).toEqual(10)
  })

  test('2 arguments', () => {
    const u8 = new Uint8Array(3)
    for (let i = 0; i < u8.length; i++) u8[i] = i + 97
    const actual = new Buffer(u8.buffer, 1)
    expect(actual.toString()).toEqual('bc')
  })

  test('2 arguments', () => {
    const u8 = new Uint8Array(3)
    for (let i = 0; i < u8.length; i++) u8[i] = i + 97
    const actual = new Buffer(u8.buffer, 1, 1)
    expect(actual.toString()).toEqual('b')
  })
})

describe('Buffer.alloc()', () => {
  test('should creates a zero-filled Buffer of length 10', () => {
    const actual = Buffer.alloc(10)
    expect(actual.toString('hex')).toEqual('00000000000000000000')
  })

  test('should creates a Buffer of length 10, filled with bytes which all have the value `1`', () => {
    const actual = Buffer.alloc(10, 1)
    expect(actual.toString('hex')).toEqual('01010101010101010101')
  })

  test('shoud creates a Buffer of length 5, filled with bytes which all have the value `a`', () => {
    const buf1 = Buffer.alloc(5, 'a')
    expect(buf1.toString('hex')).toEqual('6161616161')

    const buf2 = Buffer.alloc(5, 'a', null as any)
    expect(buf2.toString('hex')).toEqual('6161616161')
  })

  test('shoud creates a Buffer, filled with base64 encoded string', () => {
    const actual = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64')
    expect(actual.toString('hex')).toEqual('68656c6c6f20776f726c64')
  })

  test('should throw error with invalid size', () => {
    expect.hasAssertions()
    try {
      Buffer.alloc(1.2)
    } catch (err) {
      expect(err.message).toMatch(/Invalid size/)
    }
  })
})

test('Buffer.allocUnsafe()', () => {
  const actual = Buffer.allocUnsafe(10)
  expect(actual.length).toEqual(10)
})

test('Buffer.allocUnsafe() should throw error with invalid size', () => {
  expect.hasAssertions()
  try {
    Buffer.allocUnsafe(1.2)
  } catch (err) {
    expect(err.message).toMatch(/Invalid size/)
  }
})

test('Buffer.allocUnsafeSlow()', () => {
  const actual = Buffer.allocUnsafeSlow(10)
  expect(actual.length).toEqual(10)
})

test('Buffer.allocUnsafeSlow() should throw error with invalid size', () => {
  expect.hasAssertions()
  try {
    Buffer.allocUnsafeSlow(1.2)
  } catch (err) {
    expect(err.message).toMatch(/Invalid size/)
  }
})

describe('Buffer.from()', () => {
  test('should creates a Buffer containing the bytes [1, 2, 3]', () => {
    const actual = Buffer.from([1, 2, 3])
    expect(actual.toString('hex')).toEqual('010203')
  })

  test('should be truncated using `(value & 255)` to fit into the range 0-255', () => {
    const actual = Buffer.from([257, 257.5, -255, '1'] as any)
    expect(actual.toString('hex')).toEqual('01010101')
  })

  test('should treat Uint16Array as an array', () => {
    const actual = Buffer.from(new Uint16Array([0xff01, 0xff02, 0xff03]))
    expect(actual.toString('hex')).toEqual('010203')
  })

  test('should creates a Buffer containing the UTF-8 encoded bytes', () => {
    const actual = Buffer.from('tést', 'utf8')
    expect(actual.toString('hex')).toEqual('74c3a97374')
  })

  test('should creates a Buffer containing the Latin-1 bytes', () => {
    const actual = Buffer.from('tést', 'latin1')
    expect(actual.toString('hex')).toEqual('74e97374')
  })

  test('should creates a Buffer containing the utf16le bytes', () => {
    const actual = Buffer.from('fhqwhgads', 'utf16le')
    expect(actual.toString('hex')).toEqual('660068007100770068006700610064007300')
  })

  test('should creates a Buffer shares memory with u16', () => {
    const u16 = new Uint16Array(2)
    ;[u16[0], u16[1]] = [5000, 4000]
    const actual = Buffer.from(u16.buffer)
    expect(actual.toString('hex')).toEqual('8813a00f')
    u16[1] = 6000
    expect(actual.toString('hex')).toEqual('88137017')
  })

  test('should creates a Buffer from ArrayBuffer with byteOffset and length', () => {
    const ab = new ArrayBuffer(10)
    const actual = Buffer.from(ab, 0, 2)
    expect(actual.length).toEqual(2)
  })

  test('should creates a Buffer from ArrayBuffer extend beyond the range of the TypedArray', () => {
    const arrA = Uint8Array.from([0x63, 0x64, 0x65, 0x66])
    const arrB = new Uint8Array(arrA.buffer, 1, 2)
    const actual = Buffer.from(arrB.buffer)
    expect(actual.toString('hex')).toEqual('63646566')
  })

  test('should creates a Buffer from Buffer', () => {
    const buf1 = Buffer.from('buffer')
    const buf2 = Buffer.from(buf1)
    buf1[0] = 0x61
    expect(buf1.toString()).toEqual('auffer')
    expect(buf2.toString()).toEqual('buffer')
  })

  test('should creates a Buffer from String Object', () => {
    const actual = Buffer.from(new String('this is a test')) // eslint-disable-line no-new-wrappers
    expect(actual.toString('hex')).toEqual('7468697320697320612074657374')
  })

  test('should creates a Buffer from objects that support Symbol.toPrimitive', () => {
    class Foo {
      [Symbol.toPrimitive] (): string {
        return 'this is a test'
      }
    }
    const actual = Buffer.from(new Foo(), 'utf8')
    expect(actual.toString('hex')).toEqual('7468697320697320612074657374')
  })

  test('should creates a Buffer from return value to Buffer#toJSON()', () => {
    const buf1 = Buffer.from('01020304', 'hex')
    const json1 = buf1.toJSON()
    const buf2 = Buffer.from(json1)
    expect(buf2.toString('hex')).toEqual('01020304')
  })

  test('should throw a Error', () => {
    expect.hasAssertions()
    try {
      Buffer.from(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/type of value/)
    }
  })

  test('should create a zero-length Buffer from DataView', () => {
    const dv = new DataView(new Uint8Array([1, 2, 3]).buffer)
    const actual = Buffer.from(dv as any)
    expect(actual.toString('hex')).toEqual('')
  })
})

describe('Buffer.copyBytesFrom()', () => {
  test('1 arguments', () => {
    const u16 = new Uint16Array([0, 0xffff])
    const actual = Buffer.copyBytesFrom(u16)
    u16[1] = 0
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString('hex')).toEqual('0000ffff')
  })

  test('2 arguments', () => {
    const u16 = new Uint16Array([0, 0xffff])
    const actual = Buffer.copyBytesFrom(u16, 1)
    u16[1] = 0
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString('hex')).toEqual('ffff')
  })

  test('3 arguments', () => {
    const u16 = new Uint16Array([0, 0xffff])
    const actual = Buffer.copyBytesFrom(u16, 1, 1)
    u16[1] = 0
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString('hex')).toEqual('ffff')
  })

  test('DataView', () => {
    const dv = new DataView(new Uint8Array([1, 2, 3]).buffer)
    const actual = Buffer.copyBytesFrom(dv)
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString('hex')).toEqual('010203')
  })
})

test.each([
  { inputName: 'Buffer.alloc', input: Buffer.alloc(10), expected: true },
  { inputName: 'Buffer.from', input: Buffer.from('foo'), expected: true },
  { inputName: 'string', input: 'a string', expected: false },
  { inputName: 'array', input: [], expected: false },
  { inputName: 'Uint8Array', input: new Uint8Array(10), expected: false },
])('Buffer.isBuffer($inputName) = $expected', ({ input, expected }) => {
  const actual = Buffer.isBuffer(input)
  expect(actual).toBe(expected)
})

test.each([
  { input: 'utf8', expected: true },
  { input: 'hex', expected: true },
  { input: 'utf/8', expected: false },
  { input: '', expected: false },
])('Buffer.isEncoding($input) = $expected', ({ input, expected }) => {
  const actual = Buffer.isEncoding(input)
  expect(actual).toBe(expected)
})

describe('Buffer.fromView()', () => {
  test('with TypedArray', () => {
    const view1 = new Uint8Array([0, 1, 2, 3, 4])
    const actual1 = Buffer.fromView(view1, 1, 3)
    expect(actual1.toString('hex')).toEqual('010203')

    const view2 = new Uint16Array([0x1212, 0x3434, 0x5656])
    const actual2 = Buffer.fromView(view2, 1, 1)
    expect(actual2.toString('hex')).toEqual('3434')
  })

  test('with negative offset', () => {
    const view1 = new Uint8Array([0, 1, 2, 3, 4])
    const actual1 = Buffer.fromView(view1, -4, 3)
    expect(actual1.toString('hex')).toEqual('010203')

    const view2 = new Uint16Array([0x1212, 0x3434, 0x5656])
    const actual2 = Buffer.fromView(view2, -2, 1)
    expect(actual2.toString('hex')).toEqual('3434')
  })

  test('with DataView', () => {
    const view = new DataView(new Uint8Array([0, 1, 2, 3, 4]).buffer, 1, 3)
    const actual = Buffer.fromView(view).toString('hex')
    expect(actual).toEqual('010203')
  })

  test('should throw error with invalid type of view', () => {
    expect.hasAssertions()
    try {
      Buffer.fromView(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/invalid view/)
    }
  })
})

describe('Buffer#copy()', () => {
  test('1 arguments', () => {
    const buf1 = Buffer.from('abc')
    const buf2 = Buffer.from('123')

    expect(buf1.copy(buf2)).toEqual(3)
    expect(buf2.toString()).toEqual('abc')
  })

  test('2 arguments', () => {
    const buf1 = Buffer.from('abc')
    const buf2 = Buffer.from('123')

    expect(buf1.copy(buf2, 1)).toEqual(2)
    expect(buf2.toString()).toEqual('1ab')
  })

  test('3 arguments', () => {
    const buf1 = Buffer.from('abc')
    const buf2 = Buffer.from('123')

    expect(buf1.copy(buf2, 1, 1)).toEqual(2)
    expect(buf2.toString()).toEqual('1bc')
  })

  test('should copy bytes from buf1 to buf2', () => {
    const buf1 = Buffer.allocUnsafe(26)
    const buf2 = Buffer.allocUnsafe(26).fill('!')

    // 97 is the decimal ASCII value for 'a'.
    for (let i = 0; i < 26; i++) buf1[i] = i + 97

    buf1.copy(buf2, 8, 16, 20)
    expect(buf2.toString('ascii', 0, 25)).toEqual('!!!!!!!!qrst!!!!!!!!!!!!!')
  })

  test('should copy bytes from buf1 to buf2 with negative offsets', () => {
    const buf1 = Buffer.allocUnsafe(26)
    const buf2 = Buffer.allocUnsafe(26).fill('!')

    // 97 is the decimal ASCII value for 'a'.
    for (let i = 0; i < 26; i++) buf1[i] = i + 97

    buf1.copy(buf2, -18, -10, -6)
    expect(buf2.toString('ascii', 0, 25)).toEqual('!!!!!!!!qrst!!!!!!!!!!!!!')
  })

  test('shoud copy bytes from one region to an overlapping region within the same Buffer', () => {
    const buf = Buffer.allocUnsafe(26)

    // 97 is the decimal ASCII value for 'a'.
    for (let i = 0; i < 26; i++) buf[i] = i + 97

    buf.copy(buf, 0, 4, 10)
    expect(buf.toString()).toEqual('efghijghijklmnopqrstuvwxyz')
  })

  test('should copy bytes to Uint8Array target', () => {
    const buf1 = Buffer.from('abc')
    const u8arr = new Uint8Array(3)

    expect(buf1.copy(u8arr)).toEqual(3)
    expect([...u8arr]).toEqual([97, 98, 99])
  })

  test('should copy bytes to DataView target', () => {
    const buf1 = Buffer.from('abc')
    const u8arr = new Uint8Array(3)
    const dv = new DataView(u8arr.buffer)

    expect(buf1.copy(dv)).toEqual(3)
    expect([...u8arr]).toEqual([97, 98, 99])
  })
})

test('Buffer#entries()', () => {
  const buf = Buffer.from('buffer')
  const actual = []
  for (const pair of buf.entries()) actual.push(pair)
  expect(actual).toEqual([
    [0, 98],
    [1, 117],
    [2, 102],
    [3, 102],
    [4, 101],
    [5, 114],
  ])
})

test('Buffer#keys()', () => {
  const buf = Buffer.from('buffer')
  const actual = []
  for (const key of buf.keys()) actual.push(key)
  expect(actual).toEqual([0, 1, 2, 3, 4, 5])
})

test('Buffer#values()', () => {
  const buf = Buffer.from('buffer')
  const actual = []
  for (const value of buf.values()) actual.push(value)
  expect(actual).toEqual([98, 117, 102, 102, 101, 114])
})

describe('Buffer#fill()', () => {
  test('should fill with the ASCII character "h"', () => {
    const actual = Buffer.allocUnsafe(50).fill('h')
    expect(actual.toString()).toEqual('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh')
  })

  test('should fill with empty string', () => {
    const actual = Buffer.allocUnsafe(5).fill('')
    expect(actual.toString('hex')).toEqual('0000000000')
  })

  test('should fill with buffer', () => {
    const actual = Buffer.allocUnsafe(5).fill(Buffer.from('a'))
    expect(actual.toString()).toEqual('aaaaa')
  })

  test('should fill with character that takes up two bytes in UTF-8', () => {
    const actual = Buffer.allocUnsafe(5).fill('\u0222')
    expect(actual.toString('hex')).toEqual('c8a2c8a2c8')
  })

  test('should fill with hex string which contains invalid characters', () => {
    const actual = Buffer.allocUnsafe(5)

    actual.fill('a')
    expect(actual.toString('hex')).toEqual('6161616161')

    actual.fill('aazz', 'hex')
    expect(actual.toString('hex')).toEqual('aaaaaaaaaa')
  })

  test('should throw error if no valid fill data after truncated', () => {
    expect.hasAssertions()
    try {
      Buffer.allocUnsafe(5).fill('zz', 'hex')
    } catch (err) {
      expect(err.message).toMatch(/encode string/)
    }
  })

  test('should work with val, offset, encoding', () => {
    const actual = Buffer.alloc(5)
    actual.fill('a', 1, 'utf8')
    expect(actual.toString('hex')).toEqual('0061616161')
  })

  test('should throw error with invalid offset', () => {
    expect.hasAssertions()
    try {
      Buffer.allocUnsafe(5).fill('a', 1.5)
    } catch (err) {
      expect(err.message).toMatch(/type of offset or end/)
    }
  })

  test('should throw error with invalid end', () => {
    expect.hasAssertions()
    try {
      Buffer.allocUnsafe(5).fill('a', 1, 2.5)
    } catch (err) {
      expect(err.message).toMatch(/type of offset or end/)
    }
  })
})

describe('Buffer#includes()', () => {
  test.each([
    { inputName: 'this', input: 'this', expected: true },
    { inputName: 'is', input: 'is', expected: true },
    { inputName: 'Buffer.from("a buffer")', input: Buffer.from('a buffer'), expected: true },
    { inputName: '97', input: 97, expected: true },
    { inputName: 'Buffer#slice', input: Buffer.from('a buffer example').slice(0, 8), expected: true },
    { inputName: 'Buffer.from("a buffer example")', input: Buffer.from('a buffer example'), expected: false },
    { inputName: '0', input: 0, expected: false },
    { inputName: 'Buffer(1)', input: Buffer.from('a'), expected: true },
    { inputName: 'Buffer()', input: new Buffer(), expected: false },
  ])('Buffer#includes($inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('this is a buffer')
    const actual = buf.includes(input as any)
    expect(actual).toBe(expected)
  })

  test('should not includes with byteOffset', () => {
    const buf = Buffer.from('this is a buffer')
    const actual = buf.includes('this', 4)
    expect(actual).toBe(false)
  })

  test('should work with encoding argument', () => {
    const buf = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le')
    expect(buf.includes('\u03a3', 0, 'utf16le')).toBe(true)
    expect(buf.includes('\u03a3', -4, 'utf16le')).toBe(true)
  })

  test('should work with val, encoding', () => {
    const buf = Buffer.from('this is a buffer')
    const actual = buf.includes('buffer', 'utf8')
    expect(actual).toBe(true)
  })
})

describe('Buffer#indexOf()', () => {
  test.each([
    { inputName: 'this', input: 'this', expected: 0 },
    { inputName: 'is', input: 'is', expected: 2 },
    { inputName: 'Buffer.from("a buffer")', input: Buffer.from('a buffer'), expected: 8 },
    { inputName: '97', input: 97, expected: 8 },
    { inputName: '0', input: 0, expected: -1 },
    { inputName: 'Buffer#slice', input: Buffer.from('a buffer example').slice(0, 8), expected: 8 },
    { inputName: 'Buffer.from("a buffer example")', input: Buffer.from('a buffer example'), expected: -1 },
    { inputName: 'Buffer(1)', input: Buffer.from('a'), expected: 8 },
    { inputName: 'Buffer()', input: new Buffer(), expected: -1 },
  ])('Buffer#indexOf($inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('this is a buffer')
    const actual = buf.indexOf(input as any)
    expect(actual).toBe(expected)
  })

  test.each([
    { inputName: '99.9', input: 99.9, expected: 2 },
    { inputName: '256 + 99', input: 256 + 99, expected: 2 },
  ])('Buffer#indexOf($inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('abcdef')
    const actual = buf.indexOf(input)
    expect(actual).toBe(expected)
  })

  test.each([
    { inputName: 'undefined', input: undefined, expected: 1 },
    { inputName: '{}', input: {}, expected: 1 },
    { inputName: 'null', input: null, expected: 1 },
    { inputName: '[]', input: [], expected: 1 },
  ])('Buffer#indexOf("b", $inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('abcdef')
    const actual = buf.indexOf('b', input as unknown as any)
    expect(actual).toBe(expected)
  })

  test('should be -1 with byteOffset', () => {
    const buf = Buffer.from('this is a buffer')
    const actual = buf.indexOf('this', 4)
    expect(actual).toBe(-1)
  })

  test('should work with encoding argument', () => {
    const buf = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le')
    expect(buf.indexOf('\u03a3', 0, 'utf16le')).toBe(4)
    expect(buf.indexOf('\u03a3', -4, 'utf16le')).toBe(6)
  })

  test('should work with val, encoding', () => {
    const buf = Buffer.from('this is a buffer')
    expect(buf.indexOf('buffer', 'utf8')).toBe(10)
  })
})

describe('Buffer#lastIndexOf()', () => {
  test.each([
    { inputName: 'this', input: 'this', expected: 0 },
    { inputName: 'buffer', input: 'buffer', expected: 17 },
    { inputName: 'Buffer.from("buffer")', input: Buffer.from('buffer'), expected: 17 },
    { inputName: 'number', input: 97, expected: 15 },
    { inputName: 'Buffer.from("yolo")', input: Buffer.from('yolo'), expected: -1 },
    { inputName: 'Buffer.from("a")', input: Buffer.from('a'), expected: 15 },
    { inputName: 'Buffer()', input: new Buffer(), expected: -1 },
  ])('Buffer#lastIndexOf($inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('this buffer is a buffer')
    const actual = buf.lastIndexOf(input as any)
    expect(actual).toBe(expected)
  })

  test.each([
    { inputName: '99.9', input: 99.9, expected: 2 },
    { inputName: '256 + 99', input: 256 + 99, expected: 2 },
  ])('Buffer#lastIndexOf($inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('abcdef')
    const actual = buf.lastIndexOf(input)
    expect(actual).toBe(expected)
  })

  test.each([
    { inputName: 'undefined', input: undefined, expected: 1 },
    { inputName: '{}', input: {}, expected: 1 },
    { inputName: 'null', input: null, expected: -1 },
    { inputName: '[]', input: [], expected: -1 },
  ])('Buffer#lastIndexOf("b", $inputName) = $expected', ({ input, expected }) => {
    const buf = Buffer.from('abcdef')
    const actual = buf.lastIndexOf('b', input as unknown as any)
    expect(actual).toBe(expected)
  })

  test('should work with byteOffset argument', () => {
    const buf = Buffer.from('this buffer is a buffer')
    expect(buf.lastIndexOf('buffer', 5)).toBe(5)
    expect(buf.lastIndexOf('buffer', 4)).toBe(-1)
  })

  test('should work with encoding argument', () => {
    const buf = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le')
    expect(buf.lastIndexOf('\u03a3', undefined as any, 'utf16le')).toBe(6)
    expect(buf.lastIndexOf('\u03a3', -5, 'utf16le')).toBe(4)
  })

  test('should work with val, encoding', () => {
    const buf = Buffer.from('this is a buffer')
    expect(buf.lastIndexOf('buffer', 'utf8')).toBe(10)
  })
})

describe('Buffer.from()', () => {
  test.each([
    ['0123456789ABCDEF', '0123456789abcdef'],
    ['0123456789abcdef', '0123456789abcdef'],
    ['01 23 45 67 89 AB CD EF', '0123456789abcdef'],
    ['0 1 2 3 4 5 6 7 8 9 A B C D E F', '0123456789abcdef'],
    ['01\n23\n45\n67\n89\nAB\nCD\nEF', '0123456789abcdef'],
    ['1a7', '1a'],
    ['', ''],
  ])('Buffer.from(%j, \'hex\').toString(\'hex\') = %j', (input, expected) => {
    const actual = Buffer.from(input, 'hex').toString('hex')
    expect(actual).toEqual(expected)
  })

  test.each([
    ['hello world', '68656c6c6f20776f726c64'],
    ['', ''],
  ])('Buffer.from(%j, \'utf8\').toString(\'hex\') = %j', (input, expected) => {
    const actual = Buffer.from(input, 'utf8').toString('hex')
    expect(actual).toEqual(expected)
  })

  test.each([
    ['68656c6c6f20776f726c64', 'hello world'],
    ['', ''],
  ])('Buffer.from(%j, \'hex\').toString(\'utf8\') = %j', (input, expected) => {
    const actual = Buffer.from(input, 'hex').toString('utf8')
    expect(actual).toEqual(expected)
  })

  test('return Buffer with a ArrayBufferView', () => {
    const actual = Buffer.from(new Uint8Array([0x61, 0x62, 0x63]))
    expect(actual.toString()).toEqual('abc')
  })

  test('return Buffer with a iterator', () => {
    function * fn1 (): Generator<number> {
      for (let i = 0; i < 3; i++) yield i + 97
    }
    const actual = Buffer.from(fn1())
    expect(actual.toString()).toEqual('abc')
  })

  test('should throw error with invalid encoding', () => {
    expect.hasAssertions()
    try {
      Buffer.from('abc', 'utf16be' as any)
    } catch (err) {
      expect(err.message).toMatch(/Unknown encoding/)
    }
  })
})

describe('Buffer.concat()', () => {
  test('return the same Buffer with 1 buffer', () => {
    const actual = Buffer.concat([Buffer.from([0, 1])]).toString('hex')
    expect(actual).toEqual('0001')
  })

  test('return the merged Buffer with 2 buffers', () => {
    const actual = Buffer.concat([Buffer.from([0, 1]), Buffer.from([2, 3])]).toString('hex')
    expect(actual).toEqual('00010203')
  })

  test('return empty buffer with size = 0', () => {
    const actual = Buffer.concat([Buffer.from('abc')], 0)
    expect(actual.length).toEqual(0)
  })

  test('return empty buffer with size = -1', () => {
    const actual = Buffer.concat([Buffer.from('abc')], -1)
    expect(actual.length).toEqual(0)
  })

  test('return truncated buffer', () => {
    const actual = Buffer.concat([Buffer.from('abc')], 1)
    expect(actual.toString()).toEqual('a')
  })

  test('should throw error with invalid list', () => {
    expect.hasAssertions()
    try {
      Buffer.concat('' as any)
    } catch (err) {
      expect(err.message).toMatch(/an array of Buffers/)
    }
  })
})

describe('Buffer#equals()', () => {
  test('return true', () => {
    const buf1 = Buffer.from([0, 1])
    const buf2 = Buffer.from([0, 1])
    expect(Buffer.equals(buf1, buf2)).toBe(true)
  })

  test('return false with invalid type', () => {
    const actual = Buffer.from([0, 1]).equals('' as any)
    expect(actual).toBe(false)
  })

  test('return true with same data different type', () => {
    const actual = Buffer.from([0, 1]).equals(Uint8Array.of(0, 1))
    expect(actual).toBe(true)
  })

  test('return false with different data Buffer', () => {
    const actual = Buffer.from([0, 1]).equals(Buffer.from([0]))
    expect(actual).toBe(false)
  })

  test('return false with same length different data Buffer', () => {
    const actual = Buffer.from([0, 1]).equals(Buffer.from([2, 3]))
    expect(actual).toBe(false)
  })

  test('return true with same data Buffer', () => {
    const actual = Buffer.from([0, 1]).equals(Buffer.from([0, 1]))
    expect(actual).toBe(true)
  })
})

describe('Buffer#chunk()', () => {
  test('return an array of Buffer', () => {
    const actual = Buffer.from('00010203', 'hex').chunk(3)
    expect(actual[0].toString('hex')).toEqual('000102')
    expect(actual[1].toString('hex')).toEqual('03')
  })

  test('should throw error with invalid bytesPerChunk', () => {
    expect.hasAssertions()
    try {
      Buffer.from('00010203', 'hex').chunk(0)
    } catch (err) {
      expect(err.message).toMatch(/invalid bytesPerChunk/)
    }
  })
})

describe('Buffer#toString()', () => {
  test('Buffer#toString(\'hex\')', () => {
    const actual = Buffer.from([0, 1, 2])
    expect(actual.toString('hex')).toEqual('000102')
  })

  test('Buffer#toString(\'ucs2\')', () => {
    const actual = Buffer.from('610062006300', 'hex')
    expect(actual.toString('ucs2')).toEqual('abc')
  })

  test('should throw error with invalid encoding', () => {
    expect.hasAssertions()
    try {
      expect(Buffer.from('abc').toString('utf16be' as any))
    } catch (err) {
      expect(err.message).toMatch(/Unknown encoding/)
    }
  })
})

test('Buffer#toJSON()', () => {
  const actual = Buffer.from([0, 1, 2])
  expect(actual.toJSON()).toMatchObject({ type: 'Buffer', data: [0, 1, 2] })
})

describe('Buffer#readUIntBE', () => {
  test.each([
    ['000000', 0],
    ['FFFFFF', 16777215],
    ['7FFFFF', 8388607],
    ['800000', 8388608],
  ])('Buffer.from(%j, \'hex\').readUIntBE(0, 3) = %j', (hex, expected) => {
    const actual = Buffer.from(hex, 'hex').readUIntBE(0, 3)
    expect(actual).toEqual(expected)
  })

  test.each([
    [1, 0x01],
    [2, 0x0102],
    [3, 0x010203],
    [4, 0x01020304],
    [5, 0x0102030405],
    [6, 0x010203040506],
  ])('should work with byteLength = %j', (byteLength, expected) => {
    const actual = Buffer.from('010203040506', 'hex').readUIntBE(0, byteLength)
    expect(actual).toEqual(expected)
  })

  test('should work with 0 or 1 arguments', () => {
    const actual = new Buffer(7)
    expect(actual.readUIntBE()).toEqual(0)
    expect(actual.readUIntBE(1)).toEqual(0)
  })

  test.each([0, 7])('should throw error with invalid byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      new Buffer(7).readUIntBE(0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test('should throw out of range error', () => {
    expect.hasAssertions()
    try {
      new Buffer().readUIntBE(0, 4)
    } catch (err) {
      expect(err.message).toMatch(/Invalid offset/)
    }
  })
})

describe('Buffer#readUIntLE', () => {
  test.each([
    ['000000', 0],
    ['FFFFFF', 16777215],
    ['FFFF7F', 8388607],
    ['000080', 8388608],
  ])('Buffer.from(%j, \'hex\').readUIntLE(0, 3) = %j', (hex, expected) => {
    const actual = Buffer.from(hex, 'hex').readUIntLE(0, 3)
    expect(actual).toEqual(expected)
  })

  test.each([
    [1, 0x01],
    [2, 0x0201],
    [3, 0x030201],
    [4, 0x04030201],
    [5, 0x0504030201],
    [6, 0x060504030201],
  ])('should work with byteLength = %j', (byteLength, expected) => {
    const actual = Buffer.from('010203040506', 'hex').readUIntLE(0, byteLength)
    expect(actual).toEqual(expected)
  })

  test('should work with 0 or 1 arguments', () => {
    const actual = new Buffer(7)
    expect(actual.readUIntLE()).toEqual(0)
    expect(actual.readUIntLE(1)).toEqual(0)
  })

  test.each([0, 7])('should throw error with invalid byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      new Buffer(7).readUIntLE(0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test('should throw out of range error', () => {
    expect.hasAssertions()
    try {
      new Buffer().readUIntLE(0, 4)
    } catch (err) {
      expect(err.message).toMatch(/Invalid offset/)
    }
  })
})

describe('Buffer#readIntBE', () => {
  test.each([
    ['000000', 0],
    ['FFFFFF', -1],
    ['7FFFFF', 8388607],
    ['800000', -8388608],
  ])('Buffer.from(%j, \'hex\').readIntBE(0, 3) = %j', (hex, expected) => {
    const actual = Buffer.from(hex, 'hex').readIntBE(0, 3)
    expect(actual).toEqual(expected)
  })

  test('should work with 0 or 1 arguments', () => {
    const actual = new Buffer(7)
    expect(actual.readIntBE()).toEqual(0)
    expect(actual.readIntBE(1)).toEqual(0)
  })
})

describe('Buffer#readIntLE', () => {
  test.each([
    ['000000', 0],
    ['FFFFFF', -1],
    ['FFFF7F', 8388607],
    ['000080', -8388608],
  ])('Buffer.from(%j, \'hex\').readIntLE(0, 3) = %j', (hex, expected) => {
    const actual = Buffer.from(hex, 'hex').readIntLE(0, 3)
    expect(actual).toEqual(expected)
  })

  test('should work with 0 or 1 arguments', () => {
    const actual = new Buffer(7)
    expect(actual.readIntLE()).toEqual(0)
    expect(actual.readIntLE(1)).toEqual(0)
  })
})

test.each([
  [0, '000000'],
  [16777215, 'ffffff'],
  [8388607, '7fffff'],
  [8388608, '800000'],
])('Buffer#writeUIntBE(%j, 0, 3), Buffer#toString(\'hex\') = %j', (num, expected) => {
  const actual = new Buffer(3)
  actual.writeUIntBE(num, 0, 3)
  expect(actual.toString('hex')).toEqual(expected)
})

test.each([
  [0, '000000'],
  [16777215, 'ffffff'],
  [8388607, 'ffff7f'],
  [8388608, '000080'],
])('Buffer#writeUIntLE(%j, 0, 3), Buffer#toString(\'hex\') = %j', (num, expected) => {
  const actual = new Buffer(3)
  actual.writeUIntLE(num, 0, 3)
  expect(actual.toString('hex')).toEqual(expected)
})

test.each([
  ['1', 'MQ'],
  ['12', 'MTI'],
  ['123', 'MTIz'],
])('Packet.from(%j, \'utf8\').toString(\'base64url\') = %j', (str, expected) => {
  const actual = Buffer.from(str, 'utf8').toString('base64url')
  expect(actual).toEqual(expected)
})

test.each([
  ['-_-_', '-_-_'],
  ['+/+/', '-_-_'],
  ['MQ==', 'MQ'],
  ['MTI', 'MTI'],
  ['MTIz', 'MTIz'],
  ['SGVs/G8+d29ybGQ', 'SGVs_G8-d29ybGQ'],
])('Buffer.from(%j, \'base64\').toString(\'base64url\') = %j', (str, expected) => {
  const actual = Buffer.from(str, 'base64').toString('base64url')
  expect(actual).toEqual(expected)
})

test.each([
  ['-_-_', '+/+/'],
  ['+/+/', '+/+/'],
  ['MQ', 'MQ=='],
  ['MTI', 'MTI='],
  ['MTIz', 'MTIz'],
  ['SGVs_G8-d29ybGQ', 'SGVs/G8+d29ybGQ='],
])('Buffer.from(%j, \'base64url\').toString(\'base64\') = %j', (str, expected) => {
  const actual = Buffer.from(str, 'base64url').toString('base64')
  expect(actual).toEqual(expected)
})

describe('Buffer.compare()', () => {
  test.each([
    { str1: 'ABC', str2: 'AB', expected: 1 },
    { str1: 'ABC', str2: 'ABC', expected: 0 },
    { str1: 'ABC', str2: 'ABCD', expected: -1 },
    { str1: 'ABC', str2: 'BCD', expected: -1 },
    { str1: 'BCD', str2: 'ABC', expected: 1 },
    { str1: 'BCD', str2: 'ABCD', expected: 1 },
  ])('Buffer.compare("$str1", "$str2") = $expected', ({ str1, str2, expected }) => {
    const buf1 = Buffer.from(str1)
    const buf2 = Buffer.from(str2)
    expect(Buffer.compare(buf1, buf2)).toEqual(expected)
    expect(buf1.compare(buf2)).toEqual(expected)
  })

  test('should compare with Uint8Array', () => {
    const buf1 = new Uint8Array([0, 1, 2])
    const buf2 = new Uint8Array([0, 1, 2])
    expect(Buffer.compare(buf1, buf2)).toEqual(0)
  })

  test('should throw error with invalid type', () => {
    expect.hasAssertions()
    try {
      Buffer.compare(1 as any, Buffer.from(''))
    } catch (err) {
      expect(err.message).toMatch(/Invalid type/)
    }
  })

  test('should throw error with invalid type', () => {
    expect.hasAssertions()
    try {
      Buffer.compare(Buffer.from(''), 1 as any)
    } catch (err) {
      expect(err.message).toMatch(/Invalid type/)
    }
  })

  test('should throw error with invalid type', () => {
    expect.hasAssertions()
    try {
      Buffer.from('').compare(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/Invalid type/)
    }
  })
})

test.each([
  { str: '', expected: false },
  { str: 'hex', expected: true },
  { str: 'utf/8', expected: false },
  { str: 'utf8', expected: true },
])('Buffer.isEncoding("$str") = $expected', ({ str, expected }) => {
  const actual = Buffer.isEncoding(str)
  expect(actual).toEqual(expected)
})

test.each([
  ['12', 8],
  ['1234', 16],
  ['123456', 24],
  ['12345678', 32],
  ['FF', 8],
  ['FFFF', 16],
  ['FFFFFF', 24],
])('Buffer.from(%j, \'hex\').readBitMSB(offset)', (hex, bits) => {
  const buf = Buffer.from(hex, 'hex')
  const actual = _.times(bits, i => `${buf.readBitMSB(i)}`).join('')
  expect(actual).toEqual(BigInt(`0x${hex}`).toString(2).padStart(bits, '0'))
})

test.each([
  ['12', 8],
  ['1234', 16],
  ['123456', 24],
  ['12345678', 32],
  ['FF', 8],
  ['FFFF', 16],
  ['FFFFFF', 24],
])('Buffer.from(%j, \'hex\').readBitLSB(offset)', (hex, bits) => {
  const buf = Buffer.from(hex, 'hex')
  const actual = _.times(bits, i => `${buf.readBitLSB(i)}`).reverse().join('')
  expect(actual).toEqual(BigInt(`0x${hex}`).toString(2).padStart(bits, '0'))
})

describe('Buffer#swap16()', () => {
  test('should be swapped', () => {
    const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8])
    expect(buf1.swap16().toString('hex')).toEqual('0201040306050807')
  })

  test('should throw error', () => {
    expect.hasAssertions()
    try {
      Buffer.from([0x1, 0x2, 0x3]).swap16()
    } catch (err) {
      expect(err.message).toMatch(/Buffer size/)
    }
  })

  test('should conversion between UTF-16 little-endian and UTF-16 big-endian', () => {
    const buf = Buffer.from('12345', 'utf16le')
    buf.swap16()
    expect(buf.toString('hex')).toEqual('00310032003300340035')
  })
})

describe('Buffer#swap32()', () => {
  test('should be swapped', () => {
    const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8])
    expect(buf1.swap32().toString('hex')).toEqual('0403020108070605')
  })

  test('should throw error', () => {
    expect.hasAssertions()
    try {
      Buffer.from([0x1, 0x2, 0x3]).swap32()
    } catch (err) {
      expect(err.message).toMatch(/Buffer size/)
    }
  })
})

describe('Buffer#swap64()', () => {
  test('should be swapped', () => {
    const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8])
    expect(buf1.swap64().toString('hex')).toEqual('0807060504030201')
  })

  test('should throw error', () => {
    expect.hasAssertions()
    try {
      Buffer.from([0x1, 0x2, 0x3]).swap64()
    } catch (err) {
      expect(err.message).toMatch(/Buffer size/)
    }
  })
})

describe('Buffer#write()', () => {
  test('should write string', () => {
    const actual = Buffer.alloc(256)
    actual.write('\u00bd + \u00bc = \u00be', 0)
    expect(actual.toString('utf8', 0, 12)).toBe('½ + ¼ = ¾')
  })

  test('should not write string exceed the end of buffer', () => {
    const actual = Buffer.alloc(10)
    actual.write('abcd', 8)
    expect(actual.toString('utf8', 8, 10)).toBe('ab')
  })

  test('should work with val', () => {
    const actual = Buffer.alloc(10)
    actual.write('abc')
    expect(actual.toString('utf8', 0, 3)).toBe('abc')
  })

  test('should work with val, encoding', () => {
    const actual = Buffer.alloc(10)
    actual.write('abc', 'utf8')
    expect(actual.toString('utf8', 0, 3)).toBe('abc')
  })

  test('should work with val, offset, encoding', () => {
    const actual = Buffer.alloc(10)
    actual.write('abc', 1, 'utf8')
    expect(actual.toString('utf8', 1, 4)).toBe('abc')
  })

  test('should throw error with invalid val', () => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).write(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/type of val/)
    }
  })

  test('should throw error with invalid offset', () => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).write('abc', 1.5)
    } catch (err) {
      expect(err.message).toMatch(/type of offset/)
    }
  })

  test('should throw error with invalid length', () => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).write('abc', 1, 2.5)
    } catch (err) {
      expect(err.message).toMatch(/type of length/)
    }
  })

  test('should throw error with invalid encoding', () => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).write('abc', 'utf16be' as any)
    } catch (err) {
      expect(err.message).toMatch(/Unknown encoding/)
    }
  })
})

describe('Buffer.byteLength()', () => {
  test.each([
    { str: 'abc123', encoding: 'ascii', len: 6 },
    { str: 'abc123', encoding: 'binary', len: 6 },
    { str: 'abc123', encoding: 'latin1', len: 6 },
    { str: 'abc123', encoding: 'ucs-2', len: 12 },
    { str: 'abc123', encoding: 'ucs2', len: 12 },
    { str: 'abc123', encoding: 'utf-16le', len: 12 },
    { str: 'abc123', encoding: 'utf16le', len: 12 },
    { str: 'abc123', encoding: 'hex', len: 3 },
    { str: 'abc123', encoding: 'base64', len: 4 },
    { str: 'abc123==', encoding: 'base64', len: 4 },
    { str: 'abc123', encoding: 'base64url', len: 4 },
    { str: '\u00bd + \u00bc = \u00be', encoding: 'utf8', len: 12 },
    { str: '\u00bd + \u00bc = \u00be', encoding: undefined, len: 12 },
  ])('Buffer.byteLength("$str", "$encoding") = $len', ({ str, encoding, len }) => {
    expect(Buffer.byteLength(str, encoding as unknown as any)).toBe(len)
  })

  test.each([
    { str: new Buffer(1), expected: 1 },
    { str: new ArrayBuffer(1), expected: 1 },
  ])('should return byteLength of ArrayBufferView', ({ str, expected }) => {
    expect(Buffer.byteLength(str)).toBe(expected)
  })

  test('should throw error with invalid str', () => {
    expect.hasAssertions()
    try {
      Buffer.byteLength(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/type of string/)
    }
  })
})

test('read/write BigInt64', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeBigInt64BE(1n).readBigInt64BE()).toBe(1n)
  expect(buf.writeBigInt64BE(1n, 1).readBigInt64BE(1)).toBe(1n)
  expect(buf.setBigInt64(0, 1n).getBigInt64(0)).toBe(1n)
  expect(buf.setBigInt64(1, 1n).getBigInt64(1)).toBe(1n)

  // little-endian
  expect(buf.writeBigInt64LE(1n).readBigInt64LE()).toBe(1n)
  expect(buf.writeBigInt64LE(1n, 1).readBigInt64LE(1)).toBe(1n)
  expect(buf.setBigInt64(0, 1n, true).getBigInt64(0, true)).toBe(1n)
  expect(buf.setBigInt64(1, 1n, true).getBigInt64(1, true)).toBe(1n)
})

test('read/write BigUInt64', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeBigUInt64BE(1n).readBigUInt64BE()).toBe(1n)
  expect(buf.writeBigUInt64BE(1n, 1).readBigUInt64BE(1)).toBe(1n)
  expect(buf.setBigUint64(0, 1n).getBigUint64(0)).toBe(1n)
  expect(buf.setBigUint64(1, 1n).getBigUint64(1)).toBe(1n)

  // little-endian
  expect(buf.writeBigUInt64LE(1n).readBigUInt64LE()).toBe(1n)
  expect(buf.writeBigUInt64LE(1n, 1).readBigUInt64LE(1)).toBe(1n)
  expect(buf.setBigUint64(0, 1n, true).getBigUint64(0, true)).toBe(1n)
  expect(buf.setBigUint64(1, 1n, true).getBigUint64(1, true)).toBe(1n)
})

describe('read/write Float16', () => {
  test.each([
    { hex: '8000', float: -0 },
    { hex: '0000', float: 0 },
    { hex: '3bff', float: 0.99951171875 },
    { hex: '3c00', float: 1 },
    { hex: '4000', float: 2 },
    { hex: '7c00', float: Infinity },
    { hex: 'bc00', float: -1 },
    { hex: 'c000', float: -2 },
    { hex: 'fc00', float: -Infinity },
    { hex: '7e00', float: NaN },
    { hex: 'fe00', float: -parseInt('') }, // prevent -NaN to be transformed to NaN
  ])('Buffer.from("$hex", "hex").readFloat16BE() = $float', ({ hex, float }) => {
    expect(Buffer.from(hex, 'hex').readFloat16BE()).toBe(float)
    expect(new Buffer(2).writeFloat16BE(float).toString('hex')).toBe(hex)
    expect(new Buffer(2).setFloat16(0, float).toString('hex')).toBe(hex)
  })

  test('read/write Float16', () => {
    const buf = Buffer.alloc(3)

    // big-endian
    expect(buf.writeFloat16BE(-2).readFloat16BE()).toBe(-2)
    expect(buf.writeFloat16BE(-2, 1).readFloat16BE(1)).toBe(-2)
    expect(buf.setFloat16(0, -2).getFloat16(0)).toBe(-2)
    expect(buf.setFloat16(1, -2).getFloat16(1)).toBe(-2)

    // little-endian
    expect(buf.writeFloat16LE(-2).readFloat16LE()).toBe(-2)
    expect(buf.writeFloat16LE(-2, 1).readFloat16LE(1)).toBe(-2)
    expect(buf.setFloat16(0, -2, true).getFloat16(0, true)).toBe(-2)
    expect(buf.setFloat16(1, -2, true).getFloat16(1, true)).toBe(-2)
  })
})

test('read/write Float', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeFloatBE(0.5).readFloatBE()).toBe(0.5)
  expect(buf.writeFloatBE(0.5, 1).readFloatBE(1)).toBe(0.5)
  expect(buf.setFloat32(0, 0.5).getFloat32(0)).toBe(0.5)
  expect(buf.setFloat32(1, 0.5).getFloat32(1)).toBe(0.5)

  // little-endian
  expect(buf.writeFloatLE(0.5).readFloatLE()).toBe(0.5)
  expect(buf.writeFloatLE(0.5, 1).readFloatLE(1)).toBe(0.5)
  expect(buf.setFloat32(0, 0.5, true).getFloat32(0, true)).toBe(0.5)
  expect(buf.setFloat32(1, 0.5, true).getFloat32(1, true)).toBe(0.5)
})

test('read/write Double', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeDoubleBE(0.5).readDoubleBE()).toBe(0.5)
  expect(buf.writeDoubleBE(0.5, 1).readDoubleBE(1)).toBe(0.5)
  expect(buf.setFloat64(0, 0.5).getFloat64(0)).toBe(0.5)
  expect(buf.setFloat64(1, 0.5).getFloat64(1)).toBe(0.5)

  // little-endian
  expect(buf.writeDoubleLE(0.5).readDoubleLE()).toBe(0.5)
  expect(buf.writeDoubleLE(0.5, 1).readDoubleLE(1)).toBe(0.5)
  expect(buf.setFloat64(0, 0.5, true).getFloat64(0, true)).toBe(0.5)
  expect(buf.setFloat64(1, 0.5, true).getFloat64(1, true)).toBe(0.5)
})

test('read/write Int8', () => {
  const buf = Buffer.alloc(10)
  expect(buf.writeInt8(-1).readInt8()).toBe(-1)
  expect(buf.writeInt8(-1, 1).readInt8(1)).toBe(-1)
  expect(buf.setInt8(0, -1).getInt8(0)).toBe(-1)
  expect(buf.setInt8(1, -1).getInt8(1)).toBe(-1)
})

test('read/write UInt8', () => {
  const buf = Buffer.alloc(10)
  expect(buf.writeUInt8(1).readUInt8()).toBe(1)
  expect(buf.writeUInt8(1, 1).readUInt8(1)).toBe(1)
  expect(buf.setUint8(0, 1).getUint8(0)).toBe(1)
  expect(buf.setUint8(1, 1).getUint8(1)).toBe(1)
})

test('read/write Int16', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeInt16BE(0x0102).readInt16BE()).toBe(0x0102)
  expect(buf.writeInt16BE(0x0102, 1).readInt16BE(1)).toBe(0x0102)
  expect(buf.setInt16(0, 0x0102).getInt16(0)).toBe(0x0102)
  expect(buf.setInt16(1, 0x0102).getInt16(1)).toBe(0x0102)

  // little-endian
  expect(buf.writeInt16LE(0x0102).readInt16LE()).toBe(0x0102)
  expect(buf.writeInt16LE(0x0102, 1).readInt16LE(1)).toBe(0x0102)
  expect(buf.setInt16(0, 0x0102, true).getInt16(0, true)).toBe(0x0102)
  expect(buf.setInt16(1, 0x0102, true).getInt16(1, true)).toBe(0x0102)
})

test('read/write UInt16', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeUInt16BE(0x0102).readUInt16BE()).toBe(0x0102)
  expect(buf.writeUInt16BE(0x0102, 1).readUInt16BE(1)).toBe(0x0102)
  expect(buf.setUint16(0, 0x0102).getUint16(0)).toBe(0x0102)
  expect(buf.setUint16(1, 0x0102).getUint16(1)).toBe(0x0102)

  // little-endian
  expect(buf.writeUInt16LE(0x0102).readUInt16LE()).toBe(0x0102)
  expect(buf.writeUInt16LE(0x0102, 1).readUInt16LE(1)).toBe(0x0102)
  expect(buf.setUint16(0, 0x0102, true).getUint16(0, true)).toBe(0x0102)
  expect(buf.setUint16(1, 0x0102, true).getUint16(1, true)).toBe(0x0102)
})

test('read/write Int32', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeInt32BE(0x01020304).readInt32BE()).toBe(0x01020304)
  expect(buf.writeInt32BE(0x01020304, 1).readInt32BE(1)).toBe(0x01020304)
  expect(buf.setInt32(0, 0x01020304).getInt32(0)).toBe(0x01020304)
  expect(buf.setInt32(1, 0x01020304).getInt32(1)).toBe(0x01020304)

  // little-endian
  expect(buf.writeInt32LE(0x01020304).readInt32LE()).toBe(0x01020304)
  expect(buf.writeInt32LE(0x01020304, 1).readInt32LE(1)).toBe(0x01020304)
  expect(buf.setInt32(0, 0x01020304, true).getInt32(0, true)).toBe(0x01020304)
  expect(buf.setInt32(1, 0x01020304, true).getInt32(1, true)).toBe(0x01020304)
})

test('read/write UInt32', () => {
  const buf = Buffer.alloc(10)

  // big-endian
  expect(buf.writeUInt32BE(0x01020304).readUInt32BE()).toBe(0x01020304)
  expect(buf.writeUInt32BE(0x01020304, 1).readUInt32BE(1)).toBe(0x01020304)
  expect(buf.setUint32(0, 0x01020304).getUint32(0)).toBe(0x01020304)
  expect(buf.setUint32(1, 0x01020304).getUint32(1)).toBe(0x01020304)

  // little-endian
  expect(buf.writeUInt32LE(0x01020304).readUInt32LE()).toBe(0x01020304)
  expect(buf.writeUInt32LE(0x01020304, 1).readUInt32LE(1)).toBe(0x01020304)
  expect(buf.setUint32(0, 0x01020304, true).getUint32(0, true)).toBe(0x01020304)
  expect(buf.setUint32(1, 0x01020304, true).getUint32(1, true)).toBe(0x01020304)
})

describe('read/write Int', () => {
  test.each([
    { byteLength: 1, value: 0x01 },
    { byteLength: 2, value: 0x0102 },
    { byteLength: 3, value: 0x010203 },
    { byteLength: 4, value: 0x01020304 },
    { byteLength: 5, value: 0x0102030405 },
    { byteLength: 6, value: 0x010203040506 },
  ])('read/write $byteLength bytes Int', ({ byteLength, value }) => {
    const buf = Buffer.alloc(10)
    expect(buf.writeIntBE(value, 0, byteLength).readIntBE(0, byteLength)).toBe(value)
    expect(buf.writeIntLE(value, 0, byteLength).readIntLE(0, byteLength)).toBe(value)
    expect(buf.writeIntBE(value, 1, byteLength).readIntBE(1, byteLength)).toBe(value)
    expect(buf.writeIntLE(value, 1, byteLength).readIntLE(1, byteLength)).toBe(value)
  })

  test.each([0, 7])('Buffer#writeIntBE() should throw error with byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).writeIntBE(0, 0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test.each([0, 7])('Buffer#writeIntLE() should throw error with byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).writeIntLE(0, 0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test.each([
    [0, '000000'],
    [-1, 'ffffff'],
    [8388607, '7fffff'],
    [-8388608, '800000'],
  ])('Buffer#writeIntBE(%j, 0, 3), Buffer#toString(\'hex\') = %j', (num, expected) => {
    const actual = new Buffer(3)
    actual.writeIntBE(num, 0, 3)
    expect(actual.toString('hex')).toEqual(expected)
  })

  test.each([
    [0, '000000'],
    [-1, 'ffffff'],
    [8388607, 'ffff7f'],
    [-8388608, '000080'],
  ])('Buffer#writeIntLE(%j, 0, 3), Buffer#toString(\'hex\') = %j', (num, expected) => {
    const actual = new Buffer(3)
    actual.writeIntLE(num, 0, 3)
    expect(actual.toString('hex')).toEqual(expected)
  })

  test('should work with 1 arguments', () => {
    const buf1 = new Buffer(7).writeIntBE(0x010203040506)
    expect(buf1.toString('hex')).toEqual('01020304050600')
    const buf2 = new Buffer(7).writeIntLE(0x010203040506)
    expect(buf2.toString('hex')).toEqual('06050403020100')
  })

  test('should work with 2 arguments', () => {
    const buf1 = new Buffer(7).writeIntBE(0x010203040506, 1)
    expect(buf1.toString('hex')).toEqual('00010203040506')
    const buf2 = new Buffer(7).writeIntLE(0x010203040506, 1)
    expect(buf2.toString('hex')).toEqual('00060504030201')
  })

  test('Buffer#writeIntBE() should throw error with invalid byteLength', () => {
    expect.hasAssertions()
    try {
      new Buffer().writeIntBE(0, 0, 0)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test('Buffer#writeIntLE() should throw error with invalid byteLength', () => {
    expect.hasAssertions()
    try {
      new Buffer().writeIntLE(0, 0, 0)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })
})

describe('read/write UInt', () => {
  test.each([
    { byteLength: 1, value: 0x01 },
    { byteLength: 2, value: 0x0102 },
    { byteLength: 3, value: 0x010203 },
    { byteLength: 4, value: 0x01020304 },
    { byteLength: 5, value: 0x0102030405 },
    { byteLength: 6, value: 0x010203040506 },
  ])('read/write $byteLength bytes UInt', ({ byteLength, value }) => {
    const buf = Buffer.alloc(10)
    expect(buf.writeUIntBE(value, 0, byteLength).readUIntBE(0, byteLength)).toBe(value)
    expect(buf.writeUIntLE(value, 0, byteLength).readUIntLE(0, byteLength)).toBe(value)
    expect(buf.writeUIntBE(value, 1, byteLength).readUIntBE(1, byteLength)).toBe(value)
    expect(buf.writeUIntLE(value, 1, byteLength).readUIntLE(1, byteLength)).toBe(value)
  })

  test.each([0, 7])('Buffer#writeUIntBE() should throw error with byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).writeUIntBE(0, 0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test.each([0, 7])('Buffer#writeUIntLE() should throw error with byteLength = %j', byteLength => {
    expect.hasAssertions()
    try {
      Buffer.alloc(10).writeUIntLE(0, 0, byteLength)
    } catch (err) {
      expect(err.message).toMatch(/Invalid byteLength/)
    }
  })

  test('should work with 1 arguments', () => {
    const buf1 = new Buffer(7).writeUIntBE(0x010203040506)
    expect(buf1.toString('hex')).toEqual('01020304050600')
    const buf2 = new Buffer(7).writeUIntLE(0x010203040506)
    expect(buf2.toString('hex')).toEqual('06050403020100')
  })

  test('should work with 2 arguments', () => {
    const buf1 = new Buffer(7).writeUIntBE(0x010203040506, 1)
    expect(buf1.toString('hex')).toEqual('00010203040506')
    const buf2 = new Buffer(7).writeUIntLE(0x010203040506, 1)
    expect(buf2.toString('hex')).toEqual('00060504030201')
  })

  test('Buffer#writeUIntBE() should throw out of range error', () => {
    expect.hasAssertions()
    try {
      new Buffer().writeUIntBE(0)
    } catch (err) {
      expect(err.message).toMatch(/Invalid offset/)
    }
  })

  test('Buffer#writeUIntLE() should throw out of range error', () => {
    expect.hasAssertions()
    try {
      new Buffer().writeUIntLE(0)
    } catch (err) {
      expect(err.message).toMatch(/Invalid offset/)
    }
  })
})

test('read/write BitMSB', () => {
  const buf = Buffer.alloc(10)
  expect(buf.writeBitMSB(0, 0).readBitMSB(0)).toBe(0)
  expect(buf.writeBitMSB(0, 1).readBitMSB(1)).toBe(0)

  expect(buf.writeBitMSB(1, 0).readBitMSB(0)).toBe(1)
  expect(buf.writeBitMSB(1, 1).readBitMSB(1)).toBe(1)
})

test('read/write BitLSB', () => {
  const buf = Buffer.alloc(10)
  expect(buf.writeBitLSB(0, 0).readBitLSB(0)).toBe(0)
  expect(buf.writeBitLSB(0, 1).readBitLSB(1)).toBe(0)

  expect(buf.writeBitLSB(1, 0).readBitLSB(0)).toBe(1)
  expect(buf.writeBitLSB(1, 1).readBitLSB(1)).toBe(1)
})

describe('Buffer#subarray()', () => {
  test('0 arguments', () => {
    const buf = Buffer.from('buffer')
    const actual = buf.subarray()
    expect(actual.toString()).toEqual('buffer')
  })

  test('1 arguments', () => {
    const buf = Buffer.from('buffer')
    const actual = buf.subarray(1)
    expect(actual.toString()).toEqual('uffer')
  })

  test('should be modified while modify buf1', () => {
    const buf1 = Buffer.allocUnsafe(26)
    for (let i = 0; i < 26; i++) buf1[i] = i + 97 // 97 is the decimal ASCII value for 'a'
    const buf2 = buf1.subarray(0, 3)
    expect(buf2.toString()).toEqual('abc')
    buf1[0] = 33
    expect(buf2.toString()).toEqual('!bc')
  })

  test('negative indexes', () => {
    const buf = Buffer.from('buffer')
    expect(buf.subarray(-6, -1).toString()).toBe('buffe')
    expect(buf.subarray(-6, -2).toString()).toBe('buff')
    expect(buf.subarray(-5, -2).toString()).toBe('uff')
  })
})

describe('Buffer#slice()', () => {
  test('0 arguments', () => {
    const buf = Buffer.from('buffer')
    const actual = buf.slice()
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString()).toEqual('buffer')
  })

  test('1 arguments', () => {
    const buf = Buffer.from('buffer')
    const actual = buf.slice(1)
    expect(Buffer.isBuffer(actual)).toBe(true)
    expect(actual.toString()).toEqual('uffer')
  })
})

test('Buffer#reverse()', () => {
  const buf1 = Buffer.from('123')
  const buf2 = buf1.reverse()
  expect(buf1.toString()).toEqual('321')
  expect(Buffer.isBuffer(buf2)).toBe(true)
  expect(buf1).toBe(buf2)
})

test('Buffer#toReversed()', () => {
  const buf1 = Buffer.from('123')
  const buf2 = buf1.toReversed()
  expect(buf1.toString()).toEqual('123')
  expect(Buffer.isBuffer(buf2)).toBe(true)
  expect(buf2.toString()).toEqual('321')
})

describe('Buffer.pack()', () => {
  test('should work with new Buffer', () => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    const actual = Buffer.pack('<bbbx5sbbb', 1, 2, 3, 'test', 5, 6, 7)
    expect(actual.length).toBe(12)
    expect(actual.toString('hex')).toBe('010203007465737400050607')
  })

  test.each([
    { format: '!x', vals: [], hex: '00' },
    { format: '!c', vals: [' '], hex: '20' },
    { format: '!c', vals: [''], hex: '00' },
    { format: '!bb', vals: [1, -1], hex: '01ff' },
    { format: '!BB', vals: [1, 254], hex: '01fe' },
    { format: '!??', vals: [true, false], hex: '0100' },
    { format: '!hh', vals: [1, -1], hex: '0001ffff' },
    { format: '!HH', vals: [1, 0xFFFE], hex: '0001fffe' },
    { format: '<hh', vals: [1, -1], hex: '0100ffff' },
    { format: '<HH', vals: [1, 0xFFFE], hex: '0100feff' },
    { format: '!iill', vals: [1, -1, 2, -2], hex: '00000001ffffffff00000002fffffffe' },
    { format: '!IILL', vals: [1, 0xF0F0F0F0, 2, 0xCACACACA], hex: '00000001f0f0f0f000000002cacacaca' },
    { format: '!qq', vals: [1n, -1n], hex: '0000000000000001ffffffffffffffff' },
    { format: '!QQ', vals: [1n, 0xFFFFFFFFFFFFFFFFn], hex: '0000000000000001ffffffffffffffff' },
    { format: '!eeee', vals: [-0, 0.99951171875, Infinity, NaN], hex: '80003bff7c007e00' },
    { format: '<eeee', vals: [-0, 0.99951171875, Infinity, NaN], hex: '0080ff3b007c007e' },
    { format: '!ffff', vals: [-0, 0.999999940395355225, Infinity, NaN], hex: '800000003f7fffff7f8000007fc00000' },
    { format: '<ffff', vals: [-0, 0.999999940395355225, Infinity, NaN], hex: '00000080ffff7f3f0000807f0000c07f' },
    { format: '!dddd', vals: [-0, 1, Infinity, NaN], hex: '80000000000000003ff00000000000007ff00000000000007ff8000000000000' },
    { format: '<d', vals: [NaN], hex: '000000000000f87f' },
    { format: '!6s', vals: ['buffer'], hex: '627566666572' },
    { format: '!6s', vals: [Buffer.from('010203040506', 'hex')], hex: '010203040506' },
    { format: '!7p', vals: ['buffer'], hex: '06627566666572' },
    { format: '!7p', vals: [Buffer.from('010203040506', 'hex')], hex: '06010203040506' },
    { format: 'i', vals: [0x01020304], hex: '01020304' },
    { format: '@i', vals: [0x01020304], hex: '01020304' },
    { format: '=i', vals: [0x01020304], hex: '01020304' },
    { format: '<i', vals: [0x01020304], hex: '04030201' },
    { format: '>i', vals: [0x01020304], hex: '01020304' },
    { format: '!i', vals: [0x01020304], hex: '01020304' },
    { format: '<q', vals: [0x0102030405060708n], hex: '0807060504030201' },
    { format: '>q', vals: [0x0102030405060708n], hex: '0102030405060708' },
  ])('Buffer.pack("$format") = "$hex"', ({ format, vals, hex }) => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    const actual = Buffer.pack(format, ...vals)
    expect(actual.toString('hex')).toBe(hex)
  })

  test('should work with given Buffer', () => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    const actual = new Buffer(13)
    Buffer.pack(actual, '<bbbx5sbbb', 1, 2, 3, 'test', 5, 6, 7)
    expect(actual.length).toBe(13)
    expect(actual.toString('hex', 0, 12)).toBe('010203007465737400050607')
  })

  test('Buffer#pack()', () => {
    const actual = new Buffer(13)
    actual.pack('<bbbx5sbbb', 1, 2, 3, 'test', 5, 6, 7)
    expect(actual.toString('hex', 0, 12)).toBe('010203007465737400050607')
  })

  test('should throw error with invalid type of buf', () => {
    expect.hasAssertions()
    try {
      Buffer.pack(1 as any, 'c')
    } catch (err) {
      expect(err.message).toMatch(/type of buf/)
    }
  })

  test('should throw error while buf too small', () => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    expect.hasAssertions()
    try {
      const buf = new Buffer(1)
      Buffer.pack(buf, '<bbbx5sbbb', 1, 2, 3, 'test', 5, 6, 7)
    } catch (err) {
      expect(err.message).toMatch(/lenRequired =/)
    }
  })

  test('should throw error with format which packFromFn is missing', () => {
    vi.spyOn(Buffer, 'packParseFormat').mockReturnValueOnce({ littleEndian: false, items: [[1, 'n']] })
    expect.hasAssertions()
    try {
      const actual = new Buffer(1)
      Buffer.pack(actual, 'n', 1)
    } catch (err) {
      expect(err.message).toMatch(/Unknown format/)
    }
  })

  test.each([
    { format: '!c' },
    { format: '!b' },
    { format: '!?' },
    { format: '!h' },
    { format: '!i' },
    { format: '!q' },
    { format: '!e' },
    { format: '!f' },
    { format: '!d' },
    { format: '!5s' },
    { format: '!5p' },
  ])('format "$format" should throw error while vals is not enough', ({ format }) => {
    expect.hasAssertions()
    try {
      Buffer.pack(new Buffer(8), format)
    } catch (err) {
      expect(err.message).toMatch(/Not enough vals/)
    }
  })
})

describe('Buffer.unpack()', () => {
  test('should work with given Buffer', () => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    const buf = Buffer.from('010203007465737400050607', 'hex')
    const actual = Buffer.unpack(buf, '<bbbx5sbbb')
    expect(actual).toEqual([1, 2, 3, Buffer.from('test\0'), 5, 6, 7])
  })

  test('Buffer#unpack()', () => {
    const buf = Buffer.from('010203007465737400050607', 'hex')
    const actual = buf.unpack('<bbbx5sbbb')
    expect(actual).toEqual([1, 2, 3, Buffer.from('test\0'), 5, 6, 7])
  })

  test('should throw error with invalid type of buf', () => {
    expect.hasAssertions()
    try {
      Buffer.unpack(1 as any, 'c')
    } catch (err) {
      expect(err.message).toMatch(/type of buf/)
    }
  })

  test('should throw error while buf too small', () => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    expect.hasAssertions()
    try {
      const buf = new Buffer(1)
      Buffer.unpack(buf, '<bbbx5sbbb')
    } catch (err) {
      expect(err.message).toMatch(/lenRequired =/)
    }
  })

  test('should throw error with format which packFromFn is missing', () => {
    vi.spyOn(Buffer, 'packParseFormat').mockReturnValueOnce({ littleEndian: false, items: [[1, 'n']] })
    expect.hasAssertions()
    try {
      const actual = new Buffer(1)
      Buffer.unpack(actual, 'n')
    } catch (err) {
      expect(err.message).toMatch(/Unknown format/)
    }
  })

  test.each([
    { format: '!x', vals: [], hex: '00' },
    { format: '!c', vals: [Buffer.from(' ')], hex: '20' },
    { format: '!bb', vals: [1, -1], hex: '01ff' },
    { format: '!BB', vals: [1, 254], hex: '01fe' },
    { format: '!??', vals: [true, false], hex: '0100' },
    { format: '!hh', vals: [1, -1], hex: '0001ffff' },
    { format: '!HH', vals: [1, 0xFFFE], hex: '0001fffe' },
    { format: '<hh', vals: [1, -1], hex: '0100ffff' },
    { format: '<HH', vals: [1, 0xFFFE], hex: '0100feff' },
    { format: '!iill', vals: [1, -1, 2, -2], hex: '00000001ffffffff00000002fffffffe' },
    { format: '!IILL', vals: [1, 0xF0F0F0F0, 2, 0xCACACACA], hex: '00000001f0f0f0f000000002cacacaca' },
    { format: '!qq', vals: [1n, -1n], hex: '0000000000000001ffffffffffffffff' },
    { format: '!QQ', vals: [1n, 0xFFFFFFFFFFFFFFFFn], hex: '0000000000000001ffffffffffffffff' },
    { format: '!eeee', vals: [-0, 0.99951171875, Infinity, NaN], hex: '80003bff7c007e00' },
    { format: '<eeee', vals: [-0, 0.99951171875, Infinity, NaN], hex: '0080ff3b007c007e' },
    { format: '!ffff', vals: [-0, 0.999999940395355225, Infinity, NaN], hex: '800000003f7fffff7f8000007fc00000' },
    { format: '<ffff', vals: [-0, 0.999999940395355225, Infinity, NaN], hex: '00000080ffff7f3f0000807f0000c07f' },
    { format: '!dddd', vals: [-0, 1, Infinity, NaN], hex: '80000000000000003ff00000000000007ff00000000000007ff8000000000000' },
    { format: '<d', vals: [NaN], hex: '000000000000f87f' },
    { format: '!6s', vals: [Buffer.from('010203040506', 'hex')], hex: '010203040506' },
    { format: '!7p', vals: [Buffer.from('010203040506', 'hex')], hex: '06010203040506' },
    { format: 'i', vals: [0x01020304], hex: '01020304' },
    { format: '@i', vals: [0x01020304], hex: '01020304' },
    { format: '=i', vals: [0x01020304], hex: '01020304' },
    { format: '<i', vals: [0x01020304], hex: '04030201' },
    { format: '>i', vals: [0x01020304], hex: '01020304' },
    { format: '!i', vals: [0x01020304], hex: '01020304' },
    { format: '<q', vals: [0x0102030405060708n], hex: '0807060504030201' },
    { format: '>q', vals: [0x0102030405060708n], hex: '0102030405060708' },
  ])('Buffer.unpack("$format") = "$hex"', ({ format, vals, hex }) => {
    // https://github.com/ryanrolds/bufferpack/blob/master/test/cstring.test.js
    const actual = Buffer.unpack(Buffer.from(hex, 'hex'), format)
    expect(actual).toEqual(vals)
  })

  test('should throw error with unknown format', () => {
    expect.hasAssertions()
    try {
      vi.spyOn(Buffer, 'packParseFormat').mockReturnValueOnce({ littleEndian: false, items: [[1, 'z']] })
      Buffer.unpack(Buffer.from('00', 'hex'), 'z')
    } catch (err) {
      expect(err.message).toMatch(/Unknown format/)
    }
  })
})

describe('Buffer.iterUnpack()', () => {
  test('should unpack all tuples', () => {
    const buf1 = Buffer.from('01fe01fe', 'hex')
    const actual1 = [...buf1.iterUnpack('!BB')]
    expect(actual1).toEqual([[1, 254], [1, 254]])
    const actual2 = [...Buffer.iterUnpack(buf1, '!BB')]
    expect(actual2).toEqual([[1, 254], [1, 254]])
  })

  test('should throw error with invalid type of buf', () => {
    expect.hasAssertions()
    try {
      const u8arr = new Uint8Array([0, 1, 2, 3])
      console.log([...Buffer.iterUnpack(u8arr as any, '!BB')])
    } catch (err) {
      expect(err.message).toMatch(/type of buf/)
    }
  })

  test('should throw error with contents too small', () => {
    expect.hasAssertions()
    try {
      const buf = new Buffer([0])
      console.log([...Buffer.iterUnpack(buf as any, '!BB')])
    } catch (err) {
      expect(err.message).toMatch(/lenRequired/)
    }
  })

  test('should throw error with unknown format', () => {
    expect.hasAssertions()
    try {
      vi.spyOn(Buffer, 'packParseFormat').mockReturnValueOnce({ littleEndian: false, items: [[1, 'z']] })
      console.log([...Buffer.iterUnpack(Buffer.from('00', 'hex'), 'z')])
    } catch (err) {
      expect(err.message).toMatch(/Unknown format/)
    }
  })
})

describe('Buffer.packParseFormat()', () => {
  test('should throw error with invalid type of format', () => {
    expect.hasAssertions()
    try {
      Buffer.packParseFormat(1 as any)
    } catch (err) {
      expect(err.message).toMatch(/type of format/)
    }
  })

  test('should throw error with invalid format', () => {
    expect.hasAssertions()
    try {
      Buffer.packParseFormat('!')
    } catch (err) {
      expect(err.message).toMatch(/Invalid format/)
    }
  })

  test('pascal string max repeat is 255', () => {
    const actual = Buffer.packParseFormat('256p')?.items
    expect(actual).toEqual([[255, 'p']])
  })
})

test('Buffer.packCalcSize()', () => {
  const actual = Buffer.packCalcSize('!bbbx5sbbb')
  expect(actual).toBe(12)
})

describe('util.inspect()', () => {
  test('util.inpect() with empty buffer', () => {
    const actual = util.inspect(new Buffer())
    expect(actual).toBe('<Buffer >')
  })

  test('util.inpect() with short buffer', () => {
    const actual = util.inspect(Buffer.from('1122334455', 'hex'))
    expect(actual).toBe('<Buffer 11 22 33 44 55>')
  })

  test('util.inpect() with long buffer', () => {
    const actual = util.inspect(new Buffer(100))
    expect(actual).toBe('<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 50 more bytes>')
  })
})

describe('function alias test', () => {
  test.each([
    { a: 'readUInt8', b: 'readUint8' },
    { a: 'readUInt16BE', b: 'readUint16BE' },
    { a: 'readUInt16LE', b: 'readUint16LE' },
    { a: 'readUInt32BE', b: 'readUint32BE' },
    { a: 'readUInt32LE', b: 'readUint32LE' },
    { a: 'readUIntBE', b: 'readUintBE' },
    { a: 'readUIntLE', b: 'readUintLE' },
    { a: 'readBigUInt64BE', b: 'readBigUint64BE' },
    { a: 'readBigUInt64LE', b: 'readBigUint64LE' },
    { a: 'writeUInt8', b: 'writeUint8' },
    { a: 'writeUInt16BE', b: 'writeUint16BE' },
    { a: 'writeUInt16LE', b: 'writeUint16LE' },
    { a: 'writeUInt32BE', b: 'writeUint32BE' },
    { a: 'writeUInt32LE', b: 'writeUint32LE' },
    { a: 'writeUIntBE', b: 'writeUintBE' },
    { a: 'writeUIntLE', b: 'writeUintLE' },
    { a: 'writeBigUInt64BE', b: 'writeBigUint64BE' },
    { a: 'writeBigUInt64LE', b: 'writeBigUint64LE' },
  ])('Buffer#$a should be alias of Buffer#$b', ({ a, b }) => {
    const buf = new Buffer()
    expect(buf[a as any]).toBe(buf[b as any])
  })
})

describe('Buffer#sort()', () => {
  test('without compareFn', () => {
    const buf1 = Buffer.from('4010502030', 'hex')
    const buf2 = buf1.sort()
    expect(buf2.toString('hex')).toEqual('1020304050')
    expect(Buffer.isBuffer(buf2)).toBe(true)
    expect(buf1).toBe(buf2)
  })

  test('with compareFn', () => {
    const buf1 = Buffer.from('4010502030', 'hex')
    const buf2 = buf1.sort((a, b) => b - a)
    expect(buf2.toString('hex')).toEqual('5040302010')
    expect(Buffer.isBuffer(buf2)).toBe(true)
    expect(buf1).toBe(buf2)
  })
})

describe('Buffer#toSorted()', () => {
  test('without compareFn', () => {
    const buf1 = Buffer.from('4010502030', 'hex')
    const buf2 = buf1.toSorted()
    expect(buf1.toString('hex')).toEqual('4010502030')
    expect(Buffer.isBuffer(buf2)).toBe(true)
    expect(buf2.toString('hex')).toEqual('1020304050')
  })

  test('with compareFn', () => {
    const buf1 = Buffer.from('4010502030', 'hex')
    const buf2 = buf1.toSorted((a, b) => b - a)
    expect(buf1.toString('hex')).toEqual('4010502030')
    expect(Buffer.isBuffer(buf2)).toBe(true)
    expect(buf2.toString('hex')).toEqual('5040302010')
  })
})

test('Buffer#with()', () => {
  const buf1 = Buffer.from('0102030405', 'hex')
  const buf2 = buf1.with(2, 6)
  expect(buf1.toString('hex')).toEqual('0102030405')
  expect(Buffer.isBuffer(buf2)).toBe(true)
  expect(buf2.toString('hex')).toEqual('0102060405')
})

test('Buffer#not()', () => {
  const buf = Buffer.from('00010203', 'hex')
  buf.not()
  expect(buf.toString('hex')).toEqual('fffefdfc')
})

test('Buffer#toNoted()', () => {
  const buf1 = Buffer.from('00010203', 'hex')
  const buf2 = buf1.toNoted()
  expect(buf1.toString('hex')).toEqual('00010203')
  expect(buf2.toString('hex')).toEqual('fffefdfc')
})

test('Buffer#or()', () => {
  const buf = Buffer.from('010203040506070809', 'hex')
  expect(buf.or()).toEqual(15)
  expect(new Buffer().or()).toEqual(0)
})

test('Buffer#or(buf)', () => {
  const buf1 = Buffer.from('010203', 'hex')
  const buf2 = Buffer.from('102030', 'hex')
  buf1.or(buf2)
  expect(buf1.toString('hex')).toEqual('112233')
  expect(buf2.toString('hex')).toEqual('102030')
})

test('Buffer#toOred()', () => {
  const buf1 = Buffer.from('010203', 'hex')
  const buf2 = Buffer.from('102030', 'hex')
  const buf3 = buf1.toOred(buf2)
  expect(buf1.toString('hex')).toEqual('010203')
  expect(buf2.toString('hex')).toEqual('102030')
  expect(buf3.toString('hex')).toEqual('112233')
})

test('Buffer#and()', () => {
  const buf = Buffer.from('0103050709', 'hex')
  expect(buf.and()).toEqual(1)
  expect(new Buffer().and()).toEqual(0xFF)
})

test('Buffer#and(buf)', () => {
  const buf1 = Buffer.from('010203FF', 'hex')
  const buf2 = Buffer.from('102030FF', 'hex')
  buf1.and(buf2)
  expect(buf1.toString('hex')).toEqual('000000ff')
  expect(buf2.toString('hex')).toEqual('102030ff')
})

test('Buffer#toAnded()', () => {
  const buf1 = Buffer.from('010203ff', 'hex')
  const buf2 = Buffer.from('102030ff', 'hex')
  const buf3 = buf1.toAnded(buf2)
  expect(buf1.toString('hex')).toEqual('010203ff')
  expect(buf2.toString('hex')).toEqual('102030ff')
  expect(buf3.toString('hex')).toEqual('000000ff')
})

test('Buffer#xor()', () => {
  const buf = Buffer.from('01020304', 'hex')
  expect(buf.xor()).toEqual(0x04)
  expect(new Buffer().xor()).toEqual(0)
})

test('Buffer#xor(buf)', () => {
  const buf1 = Buffer.from('010203', 'hex')
  const buf2 = Buffer.from('102030', 'hex')
  buf1.xor(buf2)
  expect(buf1.toString('hex')).toEqual('112233')
  expect(buf2.toString('hex')).toEqual('102030')
})

test('Buffer#toXored()', () => {
  const buf1 = Buffer.from('010203', 'hex')
  const buf2 = Buffer.from('102030', 'hex')
  const buf3 = buf1.toXored(buf2)
  expect(buf1.toString('hex')).toEqual('010203')
  expect(buf2.toString('hex')).toEqual('102030')
  expect(buf3.toString('hex')).toEqual('112233')
})

describe('Buffer#copyWithin()', () => {
  test('Buffer#copyWithin(target, start)', () => {
    const buf1 = new Buffer([1, 2, 3, 4, 5, 6, 7, 8])
    const buf2 = buf1.copyWithin(3, 1)
    expect(buf1.toString('hex')).toEqual('0102030203040506')
    expect(Buffer.isBuffer(buf2)).toBe(true)
  })

  test('Buffer#copyWithin(target, start, end)', () => {
    const buf1 = new Buffer([1, 2, 3, 4, 5, 6, 7, 8])
    const buf2 = buf1.copyWithin(3, 1, 3)
    expect(buf1.toString('hex')).toEqual('0102030203060708')
    expect(Buffer.isBuffer(buf2)).toBe(true)
  })
})
