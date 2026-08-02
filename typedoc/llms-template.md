{{header}}
## Install

### Package manager

```shell
# use npm
npm install @taichunmin/buffer

# use yarn
yarn add @taichunmin/buffer
```

And then import the library using `import` or `require`:

```js
// import
import { Buffer } from '@taichunmin/buffer'

// require
const { Buffer } = require('@taichunmin/buffer')
```

### CDN

Powered by jsDelivr CDN:

```html
<!-- script -->
<script src="https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0"></script>
<script>
  const { Buffer } = window?.taichunmin?.buffer
</script>

<!-- module -->
<script type="module">
  import { Buffer } from 'https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm'
</script>

<!-- module + async import -->
<script type="module">
  const { Buffer } = await import('https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/+esm')
</script>
```

## Quick start

`Buffer` extends `Uint8Array`, so every `Uint8Array` method is available. On top of that it implements the Node.js `Buffer` API — `Buffer.from()`, `buf.toString(encoding)`, `buf.readUInt16BE()` and friends — plus the `pack` / `unpack` family described below.

```js
import { Buffer } from '@taichunmin/buffer'

const buf1 = Buffer.from('01020304', 'hex')
console.log(buf1.toString('hex')) // '01020304'
console.log(buf1.readUInt16BE(0)) // 258

const buf2 = Buffer.from('hello', 'utf8')
console.log(buf2.toString('base64url')) // 'aGVsbG8'

console.log(Buffer.concat([buf1, buf2]).length) // 9
console.log(Buffer.isBuffer(buf1)) // true, and false for a plain Uint8Array
```

## `pack` / `unpack` format strings

`Buffer.pack()`, `Buffer.unpack()`, `Buffer.iterUnpack()` and `Buffer.packCalcSize()` follow [Python's `struct` module](https://docs.python.org/3/library/struct.html). If you already know `struct`, the format strings are the same ones — read the two "differences from Python" notes at the end of this section before assuming they behave identically.

### Byte order prefix

The first character of a format string may set the byte order. If it is omitted, `@` is assumed.

| Prefix | Byte order |
| ------ | ---------- |
| `@` | native (whatever the host is) |
| `=` | native |
| `<` | little-endian |
| `>` | big-endian |
| `!` | big-endian (network order) |

Native order depends on the machine, so prefer `<`, `>` or `!` for anything that leaves the process.

### Format characters

| Format | C type | JavaScript type | Size |
| ------ | ------ | --------------- | ---- |
| `x` | pad byte | no value | 1 |
| `c` | `char` | `Buffer` of length 1 | 1 |
| `b` | `signed char` | `number` | 1 |
| `B` | `unsigned char` | `number` | 1 |
| `?` | `_Bool` | `boolean` | 1 |
| `h` | `short` | `number` | 2 |
| `H` | `unsigned short` | `number` | 2 |
| `i` | `int` | `number` | 4 |
| `I` | `unsigned int` | `number` | 4 |
| `l` | `long` | `number` | 4 |
| `L` | `unsigned long` | `number` | 4 |
| `q` | `long long` | `bigint` | 8 |
| `Q` | `unsigned long long` | `bigint` | 8 |
| `e` | half precision float | `number` | 2 |
| `f` | `float` | `number` | 4 |
| `d` | `double` | `number` | 8 |
| `s` | `char[]` | `Buffer` | count |
| `p` | Pascal `char[]` | `Buffer` | count |

`q` and `Q` unpack to `bigint`, never `number`. Packing accepts either, coercing a `number` with `BigInt()` — a fractional one throws a `RangeError`, and one above `Number.MAX_SAFE_INTEGER` loses precision silently (`Buffer.pack('>Q', 9007199254740993)` gives `0020000000000000`, whereas `9007199254740993n` gives `0020000000000001`). Pass a `bigint` for anything that might exceed 2^53.

`e`, `f` and `d` always use IEEE 754 binary16 / binary32 / binary64, regardless of the host.

### Repeat counts

A format character may be preceded by a decimal repeat count. For most characters the count is a repetition: `4h` means exactly `hhhh`, and consumes four values.

`s`, `p` and `x` treat the count as a **length**, not a repetition:

- `10s` is one 10-byte `Buffer` taking one value; `10c` is ten separate one-byte `Buffer`s taking ten values. When packing, the value is truncated or NUL-padded to exactly the count. Without a count, `s` means `1s`; `0s` is a single empty `Buffer`.
- `5p` is a Pascal string in exactly 5 bytes: a length byte followed by up to `count - 1` bytes of content, NUL-padded to the count. Content longer than `count - 1` is truncated.
- `2x` is two pad bytes and takes no value. When packing it writes that many NUL bytes (`0x00`); when unpacking it skips them and yields nothing. `2x` and `xx` are equivalent, in both directions.

```js
console.log(Buffer.packCalcSize('<qh6xq')) // 24
console.log(Buffer.pack('>bhl', 1, 2, 3).toString('hex')) // '01000200000003'
console.log(Buffer.unpack(Buffer.from('01fe01fe', 'hex'), '!BBbb')) // [1, 254, 1, -2]
console.log([...Buffer.iterUnpack(Buffer.from('01fe01fe', 'hex'), '!BB')]) // [[1, 254], [1, 254]]
console.log(Buffer.pack('!10s', Buffer.from('abc')).toString('hex')) // '61626300000000000000'
```

### `pack` has two overloads

This is the part that is easiest to miss when reading only the typings. `pack` is both `struct.pack` and `struct.pack_into`, chosen by whether the first argument is a `Buffer` or a format string:

```js
// struct.pack — allocates a new Buffer of exactly packCalcSize(format) bytes
const buf1 = Buffer.pack('>h', 0x0102)
console.log(buf1.toString('hex')) // '0102'

// struct.pack_into — writes into an existing Buffer, starting at index 0, and returns it
const buf2 = Buffer.alloc(3)
Buffer.pack(buf2, '>h', 0x0102)
console.log(buf2.toString('hex')) // '010200'

// the instance form of the same thing
const buf3 = Buffer.alloc(3)
buf3.pack('>h', 0x0102)
console.log(buf3.toString('hex')) // '010200'

// to write at an offset, pack into a subarray — it shares memory with the parent
const buf4 = Buffer.alloc(3)
buf4.subarray(1).pack('>h', 0x0102)
console.log(buf4.toString('hex')) // '000102'
```

The `pack_into` forms only write the bytes the format covers, and they throw a `RangeError` if the target is shorter than `packCalcSize(format)`. A longer target is fine; the trailing bytes are left as they were.

`unpack` and `iterUnpack` have the same static and instance forms: `Buffer.unpack(buf, format)` and `buf.unpack(format)`.

### Differences from Python's `struct`

- **No native size or alignment.** Python's `@` prefix also implies C struct padding; this library never inserts alignment padding for any prefix. Emit pad bytes explicitly with `x` when you need them.
- **`unpack` does not require an exact length.** Python raises unless the buffer is exactly `calcsize(format)` bytes; here the buffer only has to be at least that long, and trailing bytes are ignored.
- **A `p` count above 255 is clamped to 255.** `packCalcSize('300p')` is `255` here and `300` in Python. Keep Pascal string counts at 255 or below.

{{declarations}}
