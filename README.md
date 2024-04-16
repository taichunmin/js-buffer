<div align="center">

<h1>@taichunmin/buffer</h1>

<p>A cross platform alternative of Node buffer base on UInt8Array.</p>

[![npm version](https://img.shields.io/npm/v/@taichunmin/buffer.svg?logo=npm)](https://www.npmjs.org/package/@taichunmin/buffer)
[![jsdelivr hits](https://img.shields.io/jsdelivr/npm/hm/@taichunmin/buffer?logo=jsdelivr)](https://www.jsdelivr.com/package/npm/@taichunmin/buffer)
[![Build status](https://img.shields.io/github/actions/workflow/status/taichunmin/js-buffer/ci.yml?branch=master)](https://github.com/taichunmin/js-buffer/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/taichunmin/js-buffer?branch=master)](https://coveralls.io/github/taichunmin/js-buffer?branch=master)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=@taichunmin%2Fbuffer&query=$.install.pretty&label=install%20size)](https://packagephobia.now.sh/result?p=@taichunmin%2Fbuffer)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@taichunmin/buffer)](https://bundlephobia.com/package/@taichunmin/buffer@latest)
[![npm downloads](https://img.shields.io/npm/dm/@taichunmin/buffer.svg)](https://npm-stat.com/charts.html?package=@taichunmin%2Fbuffer)
[![GitHub contributors](https://img.shields.io/github/contributors/taichunmin/js-buffer)](https://github.com/taichunmin/js-buffer/graphs/contributors)
[![Known vulnerabilities](https://snyk.io/test/npm/@taichunmin/buffer/badge.svg)](https://snyk.io/test/npm/@taichunmin/buffer)
[![MIT License](https://img.shields.io/github/license/taichunmin/js-buffer)](https://github.com/taichunmin/js-buffer/blob/master/LICENSE)

</div>

## Getting Started

### Package manager

Use npm or yarn to install the package.

```bash
# npm
npm install @taichunmin/buffer

# yarn
yarn add @taichunmin/buffer
```

Once the package is installed, you can import the library using import or require:

```js
// import
import { Buffer } from '@taichunmin/buffer'

// require
const { Buffer } = require('@taichunmin/buffer')
```

### CDN

Using jsDelivr CDN:

```html
<!-- script -->
<script src="https://cdn.jsdelivr.net/npm/@taichunmin/buffer@0/dist/buffer.global.js"></script>
<script>
  const { Buffer } = window?.taichunmin?.buffer
</script>

<!-- module -->
<script type="module">
  import { Buffer } from 'https://esm.run/@taichunmin/buffer@0/dist/buffer.mjs'
</script>
```