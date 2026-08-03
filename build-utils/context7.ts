import { fileURLToPath } from 'url'
import { promises as fsPromises } from 'fs'
import fg from 'fast-glob'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url)) // eslint-disable-line @typescript-eslint/naming-convention

const CONTEXT7_SCRIPT = '<script src="https://context7.com/widget.js" data-library="/llmstxt/taichunmin_idv_tw_js-buffer_llms_txt"></script>'

/**
 * typedoc-plugin-llms-txt only logs a warning when a `llmsTxtDeclarations` ref fails to
 * resolve, so a stale ref would silently drop every API link and still exit 0.
 */
async function verifyLlmsTxtApiLinks (): Promise<void> {
  const filepath = path.resolve(__dirname, '../dist/llms.txt')
  const lines = (await fsPromises.readFile(filepath, 'utf8')).split('\n')
  const start = lines.findIndex(line => line.trim() === '## API')
  if (start < 0) throw new Error('llms.txt is missing the "## API" section')
  let cnt = 0
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break
    if (/^- \[[^\]]+\]\([^)]+\)/.test(line)) cnt++
  }
  if (cnt === 0) throw new Error('llms.txt has no API links, check the "llmsTxtDeclarations" refs in typedoc.json')
  console.log(`Verified ${cnt} API links in llms.txt`)
}

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
  await verifyLlmsTxtApiLinks()
  await addContext7Widget()
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
