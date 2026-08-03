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

{{declarations}}

## `pack` / `unpack` format strings

`Buffer.pack()`, `Buffer.unpack()`, `Buffer.iterUnpack()` and `Buffer.packCalcSize()` borrow their format strings from [Python's `struct` module](https://docs.python.org/3/library/struct.html). The format syntax is the same, but **the runtime behaviour is not** — this library validates far less than Python does, and several cases Python rejects loudly are silently accepted here.

If you are porting `struct` code or generating calls from `struct` knowledge, read [Differences from Python's `struct`](#differences-from-pythons-struct) first. The four that bite hardest:

1. **Integers are never range-checked.** `Buffer.pack('>B', 300)` returns `2c`, not an error.
2. **Extra values are silently ignored.** `Buffer.pack('>b', 1, 2, 3)` returns `01`.
3. **`c` / `s` / `p` unpack to views that share memory with the source buffer**, not to copies.
4. **`unpack` accepts an over-long buffer** and ignores the trailing bytes, where Python demands an exact length.

### API surface

Every operation has a static form and, except for `packCalcSize`, an instance form:

| Static | Instance | Python equivalent |
| ------ | -------- | ----------------- |
| `Buffer.pack(format, ...vals)` | — | `struct.pack` |
| `Buffer.pack(buf, format, ...vals)` | `buf.pack(format, ...vals)` | `struct.pack_into` |
| `Buffer.unpack(buf, format)` | `buf.unpack(format)` | `struct.unpack` |
| `Buffer.iterUnpack(buf, format)` | `buf.iterUnpack(format)` | `struct.iter_unpack` |
| `Buffer.packCalcSize(formatOrItems)` | — | `struct.calcsize` |
| `Buffer.packParseFormat(format)` | — | (no equivalent) |

`buf` must be a real `Buffer`. A plain `Uint8Array` throws `TypeError: Invalid type of buf` — wrap it first with `Buffer.fromView(u8)`, which shares the same memory, or `Buffer.from(u8)`, which copies. Use `fromView` when packing into a `Uint8Array` you need to see the writes in.

`unpack` always returns an array, even for a single value: `Buffer.unpack(buf, '>b')` is `[1]`, not `1`.

`Buffer.packParseFormat(format)` returns `{ littleEndian, items }`, where `items` is an array of `[repeat, type]` pairs. Passing that `items` array back to `Buffer.packCalcSize()` skips re-parsing, which is worth doing in a hot loop:

```js
const { items } = Buffer.packParseFormat('<qh6xq')
console.log(Buffer.packCalcSize(items)) // 24
```

### Byte order prefix

The first character of a format string may set the byte order. Only position 0 is accepted — `'b>h'` throws.

| Prefix | Byte order |
| ------ | ---------- |
| `<` | little-endian |
| `>` | big-endian |
| `!` | big-endian (network order) |
| `@` | native (whatever the host is) |
| `=` | native |
| (omitted) | same as `@` |

Native order follows the host, so on the x86-64 and arm64 machines almost everything runs on it means little-endian. **Prefer `<`, `>` or `!` for any bytes that leave the process** — a file, a socket, a device protocol — so the encoding does not change with the machine.

### Format characters

| Format | C type | Value when packing | Value when unpacking | Size |
| ------ | ------ | ------------------ | -------------------- | ---- |
| `x` | pad byte | takes no value | yields no value | 1 |
| `c` | `char` | anything `Buffer.from()` accepts; first byte used | `Buffer` of length 1 | 1 |
| `b` | `signed char` | `number` | `number` | 1 |
| `B` | `unsigned char` | `number` | `number` | 1 |
| `?` | `_Bool` | any value, by JS truthiness | `boolean` | 1 |
| `h` | `short` | `number` | `number` | 2 |
| `H` | `unsigned short` | `number` | `number` | 2 |
| `i` | `int` | `number` | `number` | 4 |
| `I` | `unsigned int` | `number` | `number` | 4 |
| `l` | `long` | `number` | `number` | 4 |
| `L` | `unsigned long` | `number` | `number` | 4 |
| `q` | `long long` | `bigint` (or `number`) | `bigint` | 8 |
| `Q` | `unsigned long long` | `bigint` (or `number`) | `bigint` | 8 |
| `e` | half precision float | `number` | `number` | 2 |
| `f` | `float` | `number` | `number` | 4 |
| `d` | `double` | `number` | `number` | 8 |
| `s` | `char[]` | `Buffer`/string/array | `Buffer` (a view) | count |
| `p` | Pascal `char[]` | `Buffer`/string/array | `Buffer` (a view) | count |

`i`/`I` and `l`/`L` are identical here — both are 4 bytes, since there is no native-size mode.

`n`, `N` and `P` are **not supported** and throw `TypeError: Invalid format: …`.

### Packing values: coercion, not validation

This is the largest behavioural gap from Python. Producing a value the format cannot hold is not an error; the value is coerced and then truncated.

**Integer formats (`b B h H i I l L`)** run the value through lodash `toSafeInteger` and then write it with a `DataView` setter, so it wraps modulo the field width. Nothing throws:

| Call | Result | Python |
| ---- | ------ | ------ |
| `Buffer.pack('>B', 300)` | `2c` (300 mod 256) | `struct.error` |
| `Buffer.pack('>B', -1)` | `ff` | `struct.error` |
| `Buffer.pack('>h', 1.9)` | `0001` (truncated toward zero) | `struct.error` |
| `Buffer.pack('>h', '258')` | `0102` | `struct.error` |
| `Buffer.pack('>h', null)` | `0000` | `struct.error` |
| `Buffer.pack('>h', NaN)` | `0000` | `struct.error` |
| `Buffer.pack('>h', 'abc')` | `0000` | `struct.error` |
| `Buffer.pack('>i', 1e20)` | `ffffffff` (clamped to `Number.MAX_SAFE_INTEGER`, then wrapped) | `struct.error` |

**Validate ranges yourself** before packing anything that comes from user input or the network.

**`q` / `Q`** always unpack to `bigint`, never `number`. When packing, the value goes through `BigInt()`, which is stricter than the integer path — but the result still wraps:

```js
Buffer.pack('>Q', 9007199254740993n)      // '0020000000000001'
Buffer.pack('>Q', 9007199254740993)       // '0020000000000000' — precision lost before BigInt() sees it
Buffer.pack('>Q', 2n ** 64n + 5n)         // '0000000000000005' — wraps mod 2^64
Buffer.pack('>Q', '12')                   // '000000000000000c' — numeric strings are accepted
Buffer.pack('>Q', 1.5)                    // RangeError (not an integer)
Buffer.pack('>Q', 'abc')                  // SyntaxError
Buffer.pack('>Q', null)                   // TypeError
```

Pass a `bigint` literal for anything that might exceed 2^53.

**`?`** uses JavaScript truthiness, which differs from Python's for several common values:

```js
Buffer.pack('>?', [])       // '01' — truthy in JS; Python packs an empty list as 0
Buffer.pack('>?', {})       // '01'
Buffer.pack('>?', 'false')  // '01' — any non-empty string is truthy
Buffer.pack('>?', '')       // '00'
Buffer.pack('>?', 0)        // '00'
```

Unpacking yields `true` for any non-zero byte.

**`c`, `s` and `p`** pass the value to `Buffer.from()`, so a `Buffer`, string (UTF-8) or byte array all work, but a **number throws** `TypeError: Invalid type of value: number` — `Buffer.pack('>c', 65)` is an error; use `Buffer.pack('>c', 'A')` or `Buffer.pack('>B', 65)`. `c` keeps only the first byte of whatever it is given (`Buffer.pack('>c', 'xy')` is `78`), and an empty value packs as `00`.

**`e`, `f` and `d`** always use IEEE 754 binary16 / binary32 / binary64 regardless of the host, rounding half to even. Values too large for the format saturate to `±Infinity` rather than raising, which is where `e` differs most from Python — `Buffer.pack('>e', 1e5)` is `7c00` (`Infinity`), while Python's `struct.pack('>e', 1e5)` raises `OverflowError`. Anything above `65519.996…` rounds up to `Infinity`; the largest finite binary16 is `65504`. Small magnitudes degrade into subnormals down to `2^-24` and then to `±0`.

### Argument count

Too few values throws `TypeError: Not enough vals`. **Too many are silently ignored** — Python raises `struct.error` in both directions:

```js
Buffer.pack('>bb', 1)        // TypeError: Not enough vals
Buffer.pack('>b', 1, 2, 3)   // '01' — no error, 2 and 3 are dropped
```

### Repeat counts

A format character may be preceded by a decimal repeat count. For most characters the count is a repetition: `4h` means exactly `hhhh`, and consumes four values. A count of `0` is legal and consumes nothing (`Buffer.pack('>0hb', 7)` is `07`).

`s`, `p` and `x` treat the count as a **length**, not a repetition:

- `10s` is one 10-byte `Buffer` taking one value; `10c` is ten separate one-byte `Buffer`s taking ten values. When packing, the value is truncated or NUL-padded to exactly the count. Without a count, `s` means `1s`; `0s` is a single empty `Buffer`.
- `5p` is a Pascal string in exactly 5 bytes: a length byte followed by up to `count - 1` bytes of content, NUL-padded to the count. Content longer than `count - 1` is truncated, and the stored length byte reflects the truncated length (`Buffer.pack('>5p', Buffer.from('abcdefgh'))` is `0461626364`). When unpacking, a length byte larger than `count - 1` is clamped.
- `2x` is two pad bytes and takes no value. When packing it writes that many NUL bytes (`0x00`); when unpacking it skips them and yields nothing. `2x` and `xx` are equivalent, in both directions.

### Format string validation

`packParseFormat` accepts only `/^([@=<>!]?)((?:\d*[xcbB?hHiIlLqQefdsp])+)$/`. Anything else throws `TypeError: Invalid format: …`. In particular, and unlike Python:

- **Whitespace is not allowed.** `'> b h'` throws; Python ignores whitespace between format characters.
- **The empty string is not a valid format.** `''` throws; Python's `calcsize('')` is `0`.
- A prefix character anywhere but position 0 throws.

### Unpacked `c` / `s` / `p` are views, not copies

`unpack` and `iterUnpack` return `subarray()` views into the source buffer for `c`, `s` and `p`. Mutating a result mutates the source, and holding one alive retains the whole underlying `ArrayBuffer`. Python's `struct` always returns independent `bytes`.

```js
const src = Buffer.from('0161626300', 'hex')
const [str] = Buffer.unpack(src, '>x4s')
str[0] = 0x5a
console.log(src.toString('hex')) // '015a626300' — the source changed
```

Call `.slice()` (or `Buffer.from(view)`) when you need to detach the result from the source.

### `pack` has two overloads

`pack` is both `struct.pack` and `struct.pack_into`, chosen by whether the first argument is a `Buffer` or a format string:

```js
// struct.pack — allocates a new Buffer of exactly packCalcSize(format) bytes
const buf1 = Buffer.pack('>h', 0x0102)
console.log(buf1.toString('hex')) // '0102'

// struct.pack_into — writes into an existing Buffer, starting at index 0, and returns it
const buf2 = Buffer.alloc(3)
Buffer.pack(buf2, '>h', 0x0102)
console.log(buf2.toString('hex')) // '010200'

// the instance form of the same thing, returning `this`
const buf3 = Buffer.alloc(3)
buf3.pack('>h', 0x0102)
console.log(buf3.toString('hex')) // '010200'

// to write at an offset, pack into a subarray — it shares memory with the parent
const buf4 = Buffer.alloc(3)
buf4.subarray(1).pack('>h', 0x0102)
console.log(buf4.toString('hex')) // '000102'
```

There is no `offset` parameter; `subarray()` is how you write at an offset. The `pack_into` forms only write the bytes the format covers, and they throw a `RangeError` if the target is shorter than `packCalcSize(format)`. A longer target is fine; the trailing bytes are left as they were (`Buffer.alloc(4).fill(0xEE)` packed with `'>h'` becomes `0102eeee`).

### `iterUnpack`

Reads fixed-size records until fewer than `packCalcSize(format)` bytes remain; a trailing partial record is silently dropped. Python's `iter_unpack` instead raises unless the length is an exact multiple.

```js
[...Buffer.iterUnpack(Buffer.from('0102030405', 'hex'), '>2b')] // [[1, 2], [3, 4]] — the 5th byte is dropped
[...Buffer.iterUnpack(Buffer.from('01', 'hex'), '>2b')]         // RangeError — not even one record
```

A zero-size format such as `'0b'` or `'0x'` throws `RangeError: Cannot iterate over 0-length format: …`, since it could never consume the buffer. Python raises `ValueError: cannot iterate over 0-length struct` for the same reason.

### Errors

Python raises `struct.error` for everything. This library uses ordinary JS error types, so catch accordingly:

| Error | Cause |
| ----- | ----- |
| `TypeError: Invalid format: …` | format string does not match the grammar |
| `TypeError: Invalid type of format` | format is not a string |
| `TypeError: Invalid type of buf` | `buf` is not a `Buffer` (a plain `Uint8Array` lands here) |
| `TypeError: Not enough vals` | fewer values than the format requires |
| `TypeError: Invalid type of value: number` | a number passed to `c`, `s` or `p` |
| `RangeError: buf.length = N, lenRequired = M` | buffer shorter than `packCalcSize(format)` |
| `RangeError: Cannot iterate over 0-length format: …` | `iterUnpack` with a format of size 0 |
| `RangeError` / `SyntaxError` from `BigInt()` | bad value for `q` or `Q` |

### Worked examples

```js
console.log(Buffer.packCalcSize('<qh6xq')) // 24
console.log(Buffer.pack('>bhl', 1, 2, 3).toString('hex')) // '01000200000003'
console.log(Buffer.unpack(Buffer.from('01fe01fe', 'hex'), '!BBbb')) // [1, 254, 1, -2]
console.log([...Buffer.iterUnpack(Buffer.from('01fe01fe', 'hex'), '!BB')]) // [[1, 254], [1, 254]]
console.log(Buffer.pack('!10s', Buffer.from('abc')).toString('hex')) // '61626300000000000000'
console.log(Buffer.pack('>5p', Buffer.from('ab')).toString('hex')) // '0261620000'
console.log(Buffer.unpack(Buffer.from('01020304', 'hex'), '>b2xb')) // [1, 4]
```

### Differences from Python's `struct`

| # | Behaviour | This library | Python |
| - | --------- | ------------ | ------ |
| 1 | Out-of-range integers | coerced and wrapped silently | `struct.error` |
| 2 | Non-numeric values for integer formats | coerced (`'abc'` → `0`) | `struct.error` |
| 3 | Extra values passed to `pack` | ignored | `struct.error` |
| 4 | `unpack` buffer length | must be **at least** `packCalcSize`; extra bytes ignored | must be exactly `calcsize` |
| 5 | `iter_unpack` trailing bytes | partial record dropped | `struct.error` |
| 6 | `c` / `s` / `p` unpack results | views sharing the source's memory | independent `bytes` copies |
| 7 | Native size and alignment | not supported; no padding is ever inserted for any prefix | `@` inserts C alignment padding |
| 8 | `p` count above 255 | clamped to 255 (`packCalcSize('300p')` is `255`) | `300` |
| 9 | Whitespace in the format string | `TypeError` | ignored |
| 10 | Empty format string | `TypeError` | valid, `calcsize('')` is `0` |
| 11 | `n`, `N`, `P` formats | `TypeError` | supported in native mode |
| 12 | `?` truthiness | JS rules (`[]` and `{}` are true) | Python rules (`[]` and `{}` are false) |
| 13 | Float overflow | saturates to `±Infinity` | `OverflowError` for `e`, `f` |
| 14 | Error type | `TypeError` / `RangeError` / `SyntaxError` | `struct.error` |
| 15 | `q` / `Q` results | always `bigint` | `int` |

Rows 7 and 8 are deliberate design choices. The rest follow from this library validating less than Python does, so **validate ranges and argument counts yourself** at the boundary where untrusted data enters.
