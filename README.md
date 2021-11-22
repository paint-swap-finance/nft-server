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
npm start
```

You can also run just the API without the data collection adapters:
```bash
npm run api
```

# Dependencies
We use [TypeORM](https://github.com/typeorm/typeorm)for interacting with the database

# Deployment

The infrastructure of the app consists of an EC2 server running through Elastic Beanstalk, as well as a Postgresql instance running through RDS.

The infrastructure is written as code using [AWS CDK](https://github.com/aws/aws-cdk)

You can deploy code changes and any infrastructure changes by running
```bash
npm run deploy
```