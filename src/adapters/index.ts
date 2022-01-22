import { fork } from "child_process";
require("dotenv").config();

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: String[] = [
  "moralis",
  "pancakeswap",
  "opensea",
  //"random-earth",
  "magic-eden",
  "immutablex",
  "treasure",
  "jpg-store",
  "nftrade",
  "paintswap",
  "defi-kingdoms",
];

for (const adapter of adapters) {
  const child = fork(__dirname + "/" + adapter);

  child.on("error", (error) => {
    console.log(`${adapter}-adapter: exited with error ${error}`);
  });

  child.on("exit", (exitCode) => {
    console.log(`${adapter}-adapter: returned with code ${exitCode}`);
  });
}

export { adapters };
