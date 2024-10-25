import { GatherReporter, type IBenchmarkApi, benchmark } from '@c4312/matcha'
import { Buffer as NodeBuffer } from 'node:buffer'
import { Buffer as JsBuffer } from '../lib/buffer'

const reporter = new GatherReporter()

const suts = [
  { name: 'NodeBuffer', Buffer: NodeBuffer },
  { name: 'JsBuffer', Buffer: JsBuffer },
] as Array<{ name: string, Buffer: typeof JsBuffer }>

function prepare ({ bench, suite, set, retain }: IBenchmarkApi): void {
  for (const { name, Buffer } of suts) {
    const buf = Buffer.alloc(6)
    for (let i = 1; i <= 6; i++) {
      bench(`${name}.readUIntBE(0, ${i})`, () => {
        buf.readUIntBE(0, i)
      })
    }
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 16
    bench(`${name}.alloc`, () => {
      Buffer.alloc(LENGTH)
    })
  }

  for (const { name, Buffer } of suts) {
    const buf = Buffer.alloc(32)
    bench(`${name}#bracket-notation`, () => {
      for (let i = 0; i < 32; i++) buf[i] = i + 97
    })
  }

  for (const { name, Buffer } of suts) {
    const buf1 = Buffer.alloc(32, '1')
    const buf2 = Buffer.alloc(32, '2')
    bench(`${name}.concat`, () => {
      Buffer.concat([buf1, buf2])
    })
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 16
    const buf1 = Buffer.alloc(LENGTH)
    const buf2 = Buffer.alloc(LENGTH)
    bench(`${name}#copy`, () => {
      buf1.copy(buf2)
    })
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 2 ** 14
    const buf1 = Buffer.alloc(LENGTH)
    const buf2 = Buffer.alloc(LENGTH)
    bench(`${name}#copy (big)`, () => {
      buf1.copy(buf2)
    })
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 128
    const buf = Buffer.alloc(LENGTH * 8)
    for (let i = 0; i < LENGTH; i++) buf.writeDoubleBE(i + Math.PI, i * 8)
    bench(`${name}#readDoubleBE`, () => {
      for (let i = 0; i < LENGTH; i++) buf.readDoubleBE(i * 8)
    })
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 128
    const buf = Buffer.alloc(LENGTH * 4)
    for (let i = 0; i < LENGTH; i++) buf.writeFloatBE(i + Math.PI, i * 4)
    bench(`${name}#readFloatBE`, () => {
      for (let i = 0; i < LENGTH; i++) buf.readFloatBE(i * 4)
    })
  }

  for (const { name, Buffer } of suts) {
    const LENGTH = 128
    const buf = Buffer.alloc(LENGTH * 4)
    for (let i = 0; i < LENGTH; i++) buf.writeUInt32BE(i + 7000, i * 4)
    bench(`${name}#readUInt32BE`, () => {
      for (let i = 0; i < LENGTH; i++) buf.readUInt32BE(i * 4)
    })
  }
}

async function main (): Promise<void> {
  await benchmark({ reporter, prepare })

  for (const result of reporter.results) {
    console.log('Benchmark', result.name, 'runs at', result.hz, 'ops/sec')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
