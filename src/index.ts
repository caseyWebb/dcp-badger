import * as fs from 'fs-extra'
import * as path from 'path'
import axios from 'axios'
import Koa from 'koa'
import { template as ejs } from 'lodash'
import { filter, flow, map, padCharsStart, uniq } from 'lodash/fp'
import {
  addWeeks,
  getDate as getDayOfMonth,
  getMonth,
  setDate as setDayOfMonth,
  setDay,
  setMonth,
  setYear,
  subMonths,
  subWeeks,
  format as formatDate
} from 'date-fns'

const host = 'localhost'
const port = 3000

const extensions = {
  any: '.+',
  haskell: 'hs',
  typescript: 'ts'
}

type Template = (scope: any) => string

/**
 * Main app entry point. Creates and starts the server.
 */
async function main() {
  const app = new Koa()
  const template = await createTemplate()

  app.use(createRequestHandler(template))

  const server = app.listen(port, host)

  server.on('listening', () => console.log(`Server started on ${host}:${port}`))

  process.once('SIGUSR2', () => server.close())
}

function createRequestHandler(template: Template) {
  return async function requestHandler(ctx: Koa.Context) {
    const completedDays = await getCompletedDays()
    ctx.body = template({
      getDate,
      getFill: (d: Date) => getFill(completedDays, d),
      getMonthLabel,
      getMonthX,
      formatDate
    })
    ctx.status = 200
    ctx.type = 'image/svg+xml'
  }
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

/**
 * Returns an array of normalized date strings.
 *
 * .indexOf/.includes in V8 is wicked fast, so this really isn't worth trying to do any
 * crazy optimizations (for now)
 */
async function getCompletedDays() {
  const owner = 'caseyWebb'
  const repo = 'dcp'
  const ref = 'master'
  const language = 'any'
  const ext = extensions[language]
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

main()
