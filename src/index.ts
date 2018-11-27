import { IncomingMessage, ServerResponse } from 'http'
import axios from 'axios'
import { filter, flow, map, padCharsStart, uniq } from 'lodash/fp'
import { createImage } from './svg'

enum Extensions {
  any = '.+',
  go = 'go',
  haskell = 'hs',
  javascript = 'js',
  typescript = 'ts'
}

export async function getCompletedDays() {
  const owner = 'caseyWebb'
  const repo = 'dcp'
  const ref = 'master'
  const language = 'any'
  const ext = Extensions[language]
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`
  const res = await axios.get(url)
  const regex = new RegExp(
    `(?<year>\\d{4})/(?<month>\\d+)/(?<day>\\d+)\\.${ext}`,
    'u'
  )
  const zeroPad = padCharsStart('0')
  const zeroPad2 = zeroPad(2)
  return new Set(
    flow(
      filter(({ type }: any) => type === 'blob'),
      map(({ path }: any) => regex.exec(path)),
      filter((f: RegExpExecArray) => f !== null),
      map((f: RegExpExecArray) => f.groups),
      map((f: any) => `${f.year}.${zeroPad2(f.month)}.${zeroPad2(f.day)}`),
      uniq
    )(res.data.tree)
  )
}

export default async (req: IncomingMessage, res: ServerResponse) => {
  const completedDays = await getCompletedDays()

  res.setHeader('Content-Type', 'image/svg+xml')

  return createImage(completedDays)
}
