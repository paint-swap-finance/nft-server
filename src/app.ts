import * as http from 'http'
import * as fs from 'fs'

import { getNFTDataAndStore } from './storeData'

const html = fs.readFileSync('index.html')
const port = process.env.PORT || 3000
const log = (entry: string) => fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n')

getNFTDataAndStore()

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => body += chunk)

    req.on('end', () => {
      if (req.url === '/') {
        log('Received message: ' + body)
      } else if (req.url = '/scheduled') {
        log('Received task ' + req.headers['x-aws-sqsd-taskname'] + ' scheduled at ' + req.headers['x-aws-sqsd-scheduled-at'])
      }

      res.writeHead(200, 'OK', {'Content-Type': 'text/plain'})
      res.end()
    })
  } else {
    res.writeHead(200)
    res.write(html)
    res.end()
  }
})

// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port)

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port + '/')
