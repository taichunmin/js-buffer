import { fileURLToPath } from 'url'
import { promises as fsPromises } from 'fs'
import fg from 'fast-glob'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url)) // eslint-disable-line @typescript-eslint/naming-convention

const CONTEXT7_SCRIPT = '<script src="https://context7.com/widget.js" data-library="/llmstxt/taichunmin_idv_tw_js-buffer_llms_txt"></script>'

async function addContext7Widget (): Promise<void> {
  let cnt = 0
  for (let filepath of await fg('../dist/**/*.html', { cwd: __dirname })) {
    filepath = path.resolve(__dirname, filepath)
    let content = await fsPromises.readFile(filepath, 'utf8')
    if (content.includes(CONTEXT7_SCRIPT)) continue
    content = content.replace('</body>', `${CONTEXT7_SCRIPT}</body>`)
    await fsPromises.writeFile(filepath, content, 'utf8')
    cnt++
  }
  console.log(`Added Context7 widget to ${cnt} files`)
}

export async function build (): Promise<void> {
  await addContext7Widget()
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
