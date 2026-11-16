import { test, type TestContext } from 'vitest'
import { Buffer as NodeBuffer } from 'node:buffer'
import { Buffer as LibBuffer } from '../lib/buffer'

async function compareNodeAndLib (bench: TestContext['bench'], nodeFn: () => unknown, libFn: () => unknown): Promise<void> {
  await bench.compare(
    bench('node:buffer', nodeFn),
    bench('@taichunmin/buffer', libFn),
  )
}

for (let i = 1; i <= 6; i++) {
  test(`#readUIntBE(0, ${i})`, async ({ bench }) => {
    const nodeBuf = NodeBuffer.alloc(i)
    const libBuf = LibBuffer.alloc(i)

    await compareNodeAndLib(bench, () => {
      nodeBuf.readUIntBE(0, i)
    }, () => {
      libBuf.readUIntBE(0, i)
    })
  })
}

test('alloc()', async ({ bench }) => {
  const LENGTH = 16

  await compareNodeAndLib(bench, () => {
    NodeBuffer.alloc(LENGTH)
  }, () => {
    LibBuffer.alloc(LENGTH)
  })
})

test('#bracket-notation', async ({ bench }) => {
  const nodeBuf = NodeBuffer.alloc(32)
  const libBuf = LibBuffer.alloc(32)

  await compareNodeAndLib(bench, () => {
    for (let i = 0; i < 32; i++) nodeBuf[i] = i + 97
  }, () => {
    for (let i = 0; i < 32; i++) libBuf[i] = i + 97
  })
})

test('.concat()', async ({ bench }) => {
  const nodeBuf1 = NodeBuffer.alloc(32, '1')
  const nodeBuf2 = NodeBuffer.alloc(32, '2')
  const libBuf1 = LibBuffer.alloc(32, '1')
  const libBuf2 = LibBuffer.alloc(32, '2')

  await compareNodeAndLib(bench, () => {
    NodeBuffer.concat([nodeBuf1, nodeBuf2])
  }, () => {
    LibBuffer.concat([libBuf1, libBuf2])
  })
})

test('#copy()', async ({ bench }) => {
  const LENGTH = 16
  const nodeBuf1 = NodeBuffer.alloc(LENGTH)
  const nodeBuf2 = NodeBuffer.alloc(LENGTH)
  const libBuf1 = LibBuffer.alloc(LENGTH)
  const libBuf2 = LibBuffer.alloc(LENGTH)

  await compareNodeAndLib(bench, () => {
    nodeBuf1.copy(nodeBuf2)
  }, () => {
    libBuf1.copy(libBuf2)
  })
})

test('#copy() (big)', async ({ bench }) => {
  const LENGTH = 2 ** 14
  const nodeBuf1 = NodeBuffer.alloc(LENGTH)
  const nodeBuf2 = NodeBuffer.alloc(LENGTH)
  const libBuf1 = LibBuffer.alloc(LENGTH)
  const libBuf2 = LibBuffer.alloc(LENGTH)

  await compareNodeAndLib(bench, () => {
    nodeBuf1.copy(nodeBuf2)
  }, () => {
    libBuf1.copy(libBuf2)
  })
})

test('#readDoubleBE(0)', async ({ bench }) => {
  const nodeBuf = NodeBuffer.alloc(8)
  const libBuf = LibBuffer.alloc(8)

  await compareNodeAndLib(bench, () => {
    nodeBuf.readDoubleBE(0)
  }, () => {
    libBuf.readDoubleBE(0)
  })
})

test('#readFloatBE(0)', async ({ bench }) => {
  const nodeBuf = NodeBuffer.alloc(4)
  const libBuf = LibBuffer.alloc(4)

  await compareNodeAndLib(bench, () => {
    nodeBuf.readFloatBE(0)
  }, () => {
    libBuf.readFloatBE(0)
  })
})

test('#readUInt32BE(0)', async ({ bench }) => {
  const nodeBuf = NodeBuffer.alloc(4)
  const libBuf = LibBuffer.alloc(4)

  await compareNodeAndLib(bench, () => {
    nodeBuf.readUInt32BE(0)
  }, () => {
    libBuf.readUInt32BE(0)
  })
})
