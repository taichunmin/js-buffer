import { bench, describe } from 'vitest'
import { Buffer as NodeBuffer } from 'node:buffer'
import { Buffer as LibBuffer } from '../lib/buffer'

for (let i = 1; i <= 6; i++) {
  describe(`#readUIntBE(0, ${i})`, () => {
    const nodeBuf = NodeBuffer.alloc(i)
    const libBuf = LibBuffer.alloc(i)

    bench('node:buffer', () => {
      nodeBuf.readUIntBE(0, i)
    })

    bench('@taichunmin/buffer', () => {
      libBuf.readUIntBE(0, i)
    })
  })
}

describe('alloc()', () => {
  const LENGTH = 16

  bench('node:buffer', () => {
    NodeBuffer.alloc(LENGTH)
  })

  bench('@taichunmin/buffer', () => {
    LibBuffer.alloc(LENGTH)
  })
})

describe('#bracket-notation', () => {
  const nodeBuf = NodeBuffer.alloc(32)
  const libBuf = LibBuffer.alloc(32)

  bench('node:buffer', () => {
    for (let i = 0; i < 32; i++) nodeBuf[i] = i + 97
  })

  bench('@taichunmin/buffer', () => {
    for (let i = 0; i < 32; i++) libBuf[i] = i + 97
  })
})

describe('.concat()', () => {
  const nodeBuf1 = NodeBuffer.alloc(32, '1')
  const nodeBuf2 = NodeBuffer.alloc(32, '2')
  const libBuf1 = LibBuffer.alloc(32, '1')
  const libBuf2 = LibBuffer.alloc(32, '2')

  bench('node:buffer', () => {
    NodeBuffer.concat([nodeBuf1, nodeBuf2])
  })

  bench('@taichunmin/buffer', () => {
    LibBuffer.concat([libBuf1, libBuf2])
  })
})

describe('#copy()', () => {
  const LENGTH = 16
  const nodeBuf1 = NodeBuffer.alloc(LENGTH)
  const nodeBuf2 = NodeBuffer.alloc(LENGTH)
  const libBuf1 = LibBuffer.alloc(LENGTH)
  const libBuf2 = LibBuffer.alloc(LENGTH)

  bench('node:buffer', () => {
    nodeBuf1.copy(nodeBuf2)
  })

  bench('@taichunmin/buffer', () => {
    libBuf1.copy(libBuf2)
  })
})

describe('#copy() (big)', () => {
  const LENGTH = 2 ** 14
  const nodeBuf1 = NodeBuffer.alloc(LENGTH)
  const nodeBuf2 = NodeBuffer.alloc(LENGTH)
  const libBuf1 = LibBuffer.alloc(LENGTH)
  const libBuf2 = LibBuffer.alloc(LENGTH)

  bench('node:buffer', () => {
    nodeBuf1.copy(nodeBuf2)
  })

  bench('@taichunmin/buffer', () => {
    libBuf1.copy(libBuf2)
  })
})

describe('#readDoubleBE(0)', () => {
  const nodeBuf = NodeBuffer.alloc(8)
  const libBuf = LibBuffer.alloc(8)

  bench('node:buffer', () => {
    nodeBuf.readDoubleBE(0)
  })

  bench('@taichunmin/buffer', () => {
    libBuf.readDoubleBE(0)
  })
})

describe('#readFloatBE(0)', () => {
  const nodeBuf = NodeBuffer.alloc(4)
  const libBuf = LibBuffer.alloc(4)

  bench('node:buffer', () => {
    nodeBuf.readFloatBE(0)
  })

  bench('@taichunmin/buffer', () => {
    libBuf.readFloatBE(0)
  })
})

describe('#readUInt32BE(0)', () => {
  const nodeBuf = NodeBuffer.alloc(4)
  const libBuf = LibBuffer.alloc(4)

  bench('node:buffer', () => {
    nodeBuf.readUInt32BE(0)
  })

  bench('@taichunmin/buffer', () => {
    libBuf.readUInt32BE(0)
  })
})
