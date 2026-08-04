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

`Buffer` extends `Uint8Array`, so every `Uint8Array` method is available. On top of that it implements the Node.js `Buffer` API — `Buffer.from()`, `buf.toString(encoding)`, `buf.readUInt16BE()` and friends — plus the `pack` / `unpack` family, whose format strings are documented on `Buffer.packParseFormat` in the API reference.

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
