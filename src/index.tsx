import { IncomingMessage, ServerResponse } from 'http'
import { parse as parseQueryString } from 'querystring'
import { parse as parseUrl } from 'url'
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
import { defaults, filter, flow, map, padCharsStart, uniq } from 'lodash/fp'
import { send } from 'micro'
import * as h from 'vhtml'

type QueryParams = {
  repo: string
  ref: string
  regex: string
  ext: string
  labelColor: string
  completeColor: string
  incompleteColor: string
  futureColor: string
}

module.exports = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const query = getQuery(req)
    const completedDays = await getCompletedDays(query)
    const image = createImage(query, completedDays)
    res.setHeader('Content-Type', 'image/svg+xml')
    return image
  } catch (e) {
    send(res, 500, e.message)
  }
}

function getQuery(req: IncomingMessage) {
  const unknownError = new Error('¯\\_(ツ)_/¯')
  const missingRepoParamError = new Error('"repo" query parameter is required')
  
  if (!req.url) throw unknownError
  
  const qs = parseUrl(req.url).search
  
  if (!qs) throw missingRepoParamError
  
  const query = defaults({
    repo: '',
    ext: '.+',
    ref: 'master',
    regex: `(?<year>\\d{4})/(?<month>\\d+)/(?<day>\\d+)\\.<EXT>`,
    labelColor: '#767676',
    completeColor: '#7bc96f',
    incompleteColor: '#ebedf0',
    futureColor: 'rgba(0,0,0,0)' 
  }, parseQueryString(qs.replace(/^\?/, '')))
  
  query.regex = query.regex.replace('<EXT>', query.ext)

  if (!query.repo) throw missingRepoParamError

  return query
}

async function getCompletedDays({
  repo,
  ref,
  regex: regExString
}: QueryParams) {
  const regex = new RegExp(regExString, 'u')
  const zeroPad = padCharsStart('0', 2)
  const url = `https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`
  const res = await axios.get(url)
  return new Set(
    flow(
      filter(({ type }: any) => type === 'blob'),
      map(({ path }: any) => regex.exec(path)),
      filter((f: RegExpExecArray) => f !== null),
      map((f: RegExpExecArray) => f.groups),
      map((f: any) => `${f.year}.${zeroPad(f.month)}.${zeroPad(f.day)}`),
      uniq
    )(res.data.tree)
  )
}

function createImage(query: QueryParams, completedDays: Set<string>) {
  const css = `
    * {
      font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
    }
    .month, .wday {
      fill: ${query.labelColor};
    }
    .month {
      font-size: 10px;
    }
    .wday {
      font-size: 9px;
    }
    .complete {
      fill: ${query.completeColor}
    }
    .incomplete {
      fill: ${query.incompleteColor}
    }
    .future {
      fill: ${query.futureColor}
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
  const title = formatDate(date, 'EEEE MMMM do, yyyy')
  const clazz = getBlockClass(completedDays, date)
  return (
    <rect width="10" height="10" class={clazz} x={x} y={y}>
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

function getBlockClass(completedDays: Set<string>, date: Date) {
  const now = new Date()
  const completed = completedDays.has(formatDate(date, 'yyyy.MM.dd'))
  if (date > now) {
    return 'future'
  } else if (completed) {
    return 'complete'
  } else {
    return 'incomplete'
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
