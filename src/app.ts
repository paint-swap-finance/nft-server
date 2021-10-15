import * as http from "http"
import * as fs from "fs"
import { createConnection } from "typeorm";
import "reflect-metadata";

import { adapters } from "./adapters"
import { AdapterState } from "./models/adapter-state"
import { Collection } from "./models/collection"
import { HistoricalStatistic } from "./models/historical-statistic"
import { Sale } from "./models/sale"
import { Statistic } from "./models/statistic"
import { DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from "../env";

const html = fs.readFileSync("index.html")
const port = process.env.PORT || 3000
const log = (entry: string) => fs.appendFileSync("/tmp/sample-app.log", new Date().toISOString() + " - " + entry + "\n")

createConnection({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: "nfts",
  entities: [
    AdapterState,
    Collection,
    HistoricalStatistic,
    Sale,
    Statistic,
  ],
  synchronize: true,
  logging: false,
}).then(connection => {
  adapters.forEach(adapter => adapter.run());
}).catch(error => console.log(error));

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method === "POST") {
    let body = ""
    req.on("data", (chunk) => body += chunk)

    req.on("end", () => {
      if (req.url === "/") {
        log("Received message: " + body)
      } else if (req.url = "/scheduled") {
        log("Received task " + req.headers["x-aws-sqsd-taskname"] + " scheduled at " + req.headers["x-aws-sqsd-scheduled-at"])
      }

      res.writeHead(200, "OK", {"Content-Type": "text/plain"})
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
console.log("Server running at http://127.0.0.1:" + port + "/")
