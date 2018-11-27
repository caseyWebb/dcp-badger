import { IncomingMessage, ServerResponse } from 'http'
import axios from 'axios'
import {
  addWeeks,
  getDate as getDayOfMonth,
  getMonth,
  setDay,
  subMonths,
  subWeeks,
  format as formatDate
} from 'date-fns'
import { times } from 'lodash'
import { filter, flow, map, padCharsStart, uniq } from 'lodash/fp'
import h from 'vhtml'

enum Extensions {
  any = '.+',
  go = 'go',
  haskell = 'hs',
  javascript = 'js',
  typescript = 'ts'
}

export default async (req: IncomingMessage, res: ServerResponse) => {
  const completedDays = await getCompletedDays()

  res.setHeader('Content-Type', 'image/svg+xml')

  return createImage(completedDays)
}

async function getCompletedDays() {
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

function createImage(completedDays: Set<string>) {
  const css = `
    * {
      font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
    }
    .month, .wday {
      fill: #767676;
    }
    .month {
      font-size: 10px;
    }
    .wday {
      font-size: 9px;
    }
  `
  return (
    <svg width="669" height="104" xmlns="http://www.w3.org/2000/svg">
      <style>{css}</style>
      <g>
        <g transform="translate(17, 20)">
          {times(53, (i) => createGridColumn(completedDays, i + 1))}
        </g>

        <g transform="translate(29, 10)">
          {times(12, (i) => createMonthLabel(i + 1))}
        </g>

        <text class="wday" dx="2" dy="40">
          Mon
        </text>
        <text class="wday" dx="2" dy="64">
          Wed
        </text>
        <text class="wday" dx="2" dy="89">
          Fri
        </text>
      </g>
    </svg>
  )
}

function createMonthLabel(m: number) {
  const label = getMonthLabel(m)
  const x = getMonthX(m)
  return (
    <text class="month" x={x}>
      {label}
    </text>
  )
}

function createGridColumn(completedDays: Set<string>, w: number) {
  return <g>{times(7, (d) => createGridBlock(completedDays, w, d))}</g>
}

function createGridBlock(completedDays: Set<string>, w: number, d: number) {
  const date = getDate(w, d)
  const x = 12 * w
  const y = 12 * d
  const fill = getFill(completedDays, date)
  const title = formatDate(date, 'EEEE MMMM do, yyyy')
  return (
    <rect width="10" height="10" x={x} y={y} fill={fill}>
      <title>{title}</title>
    </rect>
  )
}

function getDate(w: number, dw: number) {
  const weeksAgo = 53 - w
  let date = new Date()
  date = subWeeks(date, weeksAgo)
  date = setDay(date, dw)
  return date
}

function getFill(completedDays: Set<string>, date: Date) {
  const now = new Date()
  const completed = completedDays.has(formatDate(date, 'yyyy.MM.dd'))
  const transparent = 'rgba(0,0,0,0)'
  const green = '#7bc96f'
  const gray = '#ebedf0'
  switch (true) {
    case date > now: return transparent
    case completed: return green
    default: return gray
  }
}

function getMonthLabel(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const then = subMonths(now, monthsAgo)
  return formatDate(then, 'MMM')
}

function getMonthX(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const targetMonth = getMonth(subMonths(now, monthsAgo))
  let then = setDay(subMonths(now, 12), 0)
  let column = 0
  while (getMonth(then) !== targetMonth || getDayOfMonth(then) > 7) {
    column++
    then = addWeeks(then, 1)
  }
  return 12 * column
}
