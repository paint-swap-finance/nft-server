# What It Does
Runs a Node process on Elastic Beanstalk to harvest NFT data from various sources

# How It Does
The gist is the program runs multiple adapters on a continuous loop. Each adapter collects data from a different data source e.g. Opensea or the Ethereum Blockchain.

# How To Run Locally
You need to run Postgres locally:
```bash
brew cask install docker
docker-compose up
```

Then you can run the app, which runs a webserver and the data collection adapters:
```bash
npx ts-node src/app.ts 
```

# Dependencies
We use [TypeORM](https://github.com/typeorm/typeorm) for interacting with the database
