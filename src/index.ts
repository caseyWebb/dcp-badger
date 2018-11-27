import * as fs from 'fs-extra'
import * as path from 'path'
import _ from 'lodash'
import Koa from 'koa'

const host = 'localhost'
const port = 3000

type Template = (data: TemplateData) => string

type TemplateData = {}
;(async function main() {
  const app = new Koa()
  const template = await createTemplate()

  app.use(createRequestHandler(template))

  const server = app.listen(port, host)

  server.on('listening', () => console.log(`Server started on ${host}:${port}`))

  process.once('SIGUSR2', () => server.close())
})()

function createRequestHandler(template: Template) {
  return async function requestHandler(ctx: Koa.Context) {
    ctx.body = template({})
    ctx.status = 200
    ctx.type = 'image/svg+xml'
  }
}

async function createTemplate(): Promise<Template> {
  const templateString = await fs.readFile(
    path.resolve(__dirname, './image.ejs'),
    'utf-8'
  )
  return _.template(templateString)
}
