import * as fs from 'fs-extra'
import * as path from 'path'
import { template as ejs } from 'lodash'
import { filter, flow, map, uniqBy } from 'lodash/fp'
import axios from 'axios'
import Koa from 'koa'

const host = 'localhost'
const port = 3000

const extensions = {
  any: '.+',
  haskell: 'hs',
  typescript: 'ts'
}

type Template = (data: TemplateData) => string

type TemplateData = {}

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
    const data = await getTemplateData()
    console.log(data)
    ctx.body = template(data)
    ctx.status = 200
    ctx.type = 'image/svg+xml'
  }
}

async function createTemplate(): Promise<Template> {
  const templateString = await fs.readFile(
    path.resolve(__dirname, './image.ejs'),
    'utf-8'
  )
  return ejs(templateString)
}

async function getTemplateData() {
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
  const files = flow(
    filter(({ type }: any) => type === 'blob'),
    map(({ path }: any) => regex.exec(path)),
    filter((f: RegExpExecArray) => f !== null),
    map((f: RegExpExecArray) => f.groups),
    uniqBy((f: any) => f.year + f.month + f.day)
  )(res.data.tree)
  return files
}

main()
