import * as fs from 'fs-extra'
import * as path from 'path'
import Koa from 'koa'

const host = 'localhost'
const port = 3000

const app = new Koa()

app.use(async (ctx) => {
  const image = await fs.createReadStream(path.resolve(__dirname, './svg.svg'))
  ctx.body = image
  ctx.status = 200
  ctx.type = 'image/svg+xml'
})

app
  .listen(port, host)
  .on('listening', () => console.log(`Server started on ${host}:${port}`))
