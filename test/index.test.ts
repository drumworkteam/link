import assert from 'assert'
import { promises as fs } from 'fs'
import test from 'node:test'
import { dirname } from 'path'
import stripAnsi from 'strip-ansi'
import { fileURLToPath } from 'url'

import makeLinkTree, { showLinkTree } from '../code/tree/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FIND = process.env.FIND

async function start() {
  const fixtures = (await fs.readdir(`${__dirname}/file`))
    .filter(x => x.endsWith('.link'))
    .map(x => `${__dirname}/file/${x}`)
    .filter(x => !FIND || x.match(FIND))

  for (const path of fixtures) {
    const localPath = path.replace(`${__dirname}/`, '')
    test(`make ${localPath}`, async () => {
      const content = await fs.readFile(path, 'utf-8')
      const [provided, expected] = content
        .split(/\n---\n/)
        .map(x => x.trim())
      assert(provided, 'Should have defined provided input')
      assert(expected, 'Should have defined expected output')
      assertParse(path, provided, expected)
    })
  }

  const kinkFixtures = (await fs.readdir(`${__dirname}/file/kink`))
    .filter(x => x.endsWith('.link'))
    .map(x => `${__dirname}/file/kink/${x}`)
    .filter(x => !FIND || x.match(FIND))

  for (const path of kinkFixtures) {
    const localPath = path.replace(`${__dirname}/`, '')
    test(`make ${localPath}`, async () => {
      const content = await fs.readFile(path, 'utf-8')
      const [provided, expected] = content
        .split(/\n---\n/)
        .map(x => x.trim())
      assert(provided, 'Should have defined provided input')
      assert(expected, 'Should have defined expected output')
      assertParseKink(path, provided, expected)
    })
  }
}

start()

function assertParse(file: string, provided: string, expected: string) {
  const lead = makeLinkTree({ file, text: provided })

  if (Array.isArray(lead)) {
    console.log(lead)
    throw new Error('Error')
  }

  const output = trimLines(showLinkTree(lead.linkTree))

  const a = String(stripAnsi(output)).trim()
  const b = String(stripAnsi(expected)).trim()

  if (a !== b) {
    console.log(a)
    throw new Error(`${a} != ${b}`)
    // code.throwError(code.generateStringMismatchError(data, a, b))
  }
}

function assertParseKink(
  file: string,
  provided: string,
  expected: string,
) {
  try {
    const data = makeLinkTree({ file, text: provided })
  } catch (e) {
    if (e instanceof Error) {
      if (e.message != expected) {
        throw e
      }
    }
  }
}

function trimLines(text: string): string {
  return text
    .split('\n')
    .map(x => x.slice(2))
    .join('\n')
}
