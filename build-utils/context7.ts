import { getSiteurl } from './dotenv'

import { fileURLToPath } from 'url'
import { promises as fsPromises } from 'fs'
import fg from 'fast-glob'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url)) // eslint-disable-line @typescript-eslint/naming-convention

const CONTEXT7_SCRIPT = '<script src="https://context7.com/widget.js" data-library="/llmstxt/taichunmin_idv_tw_js-buffer_llms_txt"></script>'

const LLMS_TXT = path.resolve(__dirname, '../dist/llms.txt')

/** A link target that already carries a scheme, a protocol-relative host or a fragment. */
const ABSOLUTE_LINK = /^(?:[a-z][a-z\d+\-.]*:|\/\/|#)/i

const MARKDOWN_LINK = /(\[[^\]]*\]\()([^)\s]+)(\))/g

/**
 * typedoc-plugin-llms-txt only logs a warning when a `llmsTxtDeclarations` ref fails to
 * resolve, so a stale ref would silently drop every API link and still exit 0.
 */
async function verifyLlmsTxtApiLinks (): Promise<void> {
  const lines = (await fsPromises.readFile(LLMS_TXT, 'utf8')).split('\n')
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

/**
 * typedoc writes the API links relative to `dist/llms.txt`, but the file is read on its own
 * by crawlers and LLM clients that have no base URL to resolve them against, so every link
 * is rewritten against `BASEURL`. Rerunning this is a no-op.
 */
async function absolutizeLlmsTxtLinks (): Promise<void> {
  let cnt = 0
  let isFenced = false
  const lines = (await fsPromises.readFile(LLMS_TXT, 'utf8')).split('\n').map(line => {
    if (line.trimStart().startsWith('```')) isFenced = !isFenced
    if (isFenced) return line // a JS sample like `fns[0](arg)` is not a link
    return line.replace(MARKDOWN_LINK, (matched, prefix, url, suffix) => {
      if (ABSOLUTE_LINK.test(url)) return matched
      cnt++
      return `${prefix}${getSiteurl(url)}${suffix}`
    })
  })
  await fsPromises.writeFile(LLMS_TXT, lines.join('\n'), 'utf8')
  console.log(`Rewrote ${cnt} relative links in llms.txt to ${getSiteurl()}`)
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
  await absolutizeLlmsTxtLinks()
  await addContext7Widget()
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
