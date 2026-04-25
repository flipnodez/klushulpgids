/**
 * Custom Next.js server voor Scalingo.
 * Scalingo verwacht een server die naar process.env.PORT luistert; dit script
 * wikkelt next() en bindt aan 0.0.0.0:PORT.
 */
const { createServer } = require('node:http')
const { parse } = require('node:url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = Number.parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url ?? '/', true)
      handle(req, res, parsedUrl).catch((err) => {
        console.error('Request handler error', err)
        res.statusCode = 500
        res.end('Internal Server Error')
      })
    })

    server.listen(port, hostname, () => {
      console.log(`▶ Klushulpgids ready on http://${hostname}:${port}`)
    })

    const shutdown = (signal) => {
      console.log(`${signal} received — shutting down`)
      server.close(() => process.exit(0))
      setTimeout(() => process.exit(1), 10_000).unref()
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  })
  .catch((err) => {
    console.error('Failed to start server', err)
    process.exit(1)
  })
