import * as fs from 'fs-extra'
import * as path from 'path'
import axios from 'axios'
import Koa from 'koa'
import { template as ejs } from 'lodash'
import { filter, flow, map, uniq } from 'lodash/fp'
import { addWeeks, getDate, getMonth, setDay, subMonths, format } from 'date-fns'

const host = 'localhost'
const port = 3000

const extensions = {
  any: '.+',
  haskell: 'hs',
  typescript: 'ts'
}

type Template = (data: TemplateData) => string

type TemplateData = {

}

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
    console.log(completedDays)
    ctx.body = template({
      getFill,
      getMonthLabel,
      getMonthX
    })
    ctx.status = 200
    ctx.type = 'image/svg+xml'
  }
}

function getFill(w: number, d: number) {
  return '#ebedf0'
}

function getMonthLabel(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const then = subMonths(now, monthsAgo)
  return format(then, 'MMM')
}

function getMonthX(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const targetMonth = getMonth(subMonths(now, monthsAgo))
  let then = setDay(subMonths(now, 12), 0)
  let column = 0
  while (getMonth(then) !== targetMonth || getDate(then) > 7) {
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
    `(?<year>\\d+)/(?<month>\\d+)/(?<day>\\d+)\\.${ext}`,
    'u'
  )
  return flow(
    filter(({ type }: any) => type === 'blob'),
    map(({ path }: any) => regex.exec(path)),
    filter((f: RegExpExecArray) => f !== null),
    map((f: RegExpExecArray) => f.groups),
    map((f: any) => `${f.year}.${f.month}.${f.day}`),
    uniq,
  )(res.data.tree)
}

main()
