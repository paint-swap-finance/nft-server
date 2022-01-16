import { fork } from "child_process";
require("dotenv").config();

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: string[] = [
  "moralis",
  "pancakeswap",
  "opensea",
  //"random-earth",
  "magic-eden",
  "immutablex",
  "treasure",
  "jpg-store",
  "nftrade",
];

const runAdapter = (name: string, attempt: number = 1) => {
  const child = fork(__dirname + "/" + name);

  child.on("exit", (exitCode) => {
    /*
     Restart adapter if it stops. Since the adapters run on a loop,
     it should never exit with or without an error so we restart on any exit code.
     If the number of restart attempts exceeds a threshold, we stop the adapter to 
     prevent restarting broken adapters - these should be fixed instead. 
    */
    if (attempt <= 5) {
      console.log(
        `${name}-adapter: returned with code ${exitCode}, restarting`
      );
      runAdapter(name, attempt + 1);
    } else {
      console.log(
        `${name}-adapter: has been restarted too many times, stopping`
      );
    }
  });
};

for (const adapter of adapters) {
  runAdapter(adapter);
}

export { adapters };
