import * as fs from 'fs-extra'
import { IncomingMessage, ServerResponse } from 'http'
import * as path from 'path'
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
import { template as ejs } from 'lodash'
import { filter, flow, map, padCharsStart, uniq } from 'lodash/fp'

enum Extensions {
  any = '.+',
  go = 'go',
  haskell = 'hs',
  javascript = 'js',
  typescript = 'ts'
}

type Template = (scope: any) => string

function getDate(w: number, dw: number) {
  const weeksAgo = 53 - w
  let date = new Date()
  date = subWeeks(date, weeksAgo)
  date = setDay(date, dw)
  return date
}

function getFill(completedDays: Set<string>, date: Date) {
  const now = new Date()
  if (date > now) {
    return 'rgba(0,0,0,0)'
  }
  const isComplete = completedDays.has(formatDate(date, 'yyyy.MM.dd'))
  return isComplete ? '#7bc96f' : '#ebedf0'
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

async function createTemplate(): Promise<Template> {
  const templateString = await fs.readFile(
    path.resolve(__dirname, './image.ejs'),
    'utf-8'
  )
  return ejs(templateString)
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

export default async (req: IncomingMessage, res: ServerResponse) => {
  const [template, completedDays] = await Promise.all([
    createTemplate(),
    getCompletedDays()
  ])

  res.setHeader('Content-Type', 'image/svg+xml')

  return template({
    getDate,
    getFill: (d: Date) => getFill(completedDays, d),
    getMonthLabel,
    getMonthX,
    formatDate
  })
}
