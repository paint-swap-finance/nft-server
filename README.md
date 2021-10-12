# What It Does
Runs a Node process on Elastic Beanstalk to harvest NFT data from various sources

# How It Does
The gist is the program runs multiple adapters on a continuous loop. Each adapter collects data from a different data source e.g. Opensea or the Ethereum Blockchain.

# How To Run Locally
You need to run dynamodb locally:
```bash
brew cask install docker
docker pull amazon/dynamodb-local
npm run dynamodb
```

Then you need to create the tables in DynamoDB:
```bash
AWS_SDK_LOAD_CONFIG=true DYNAMO_TYPES_ENDPOINT=http://127.0.0.1:8000 npm run create-tables
```

Then you can run the test process:
```bash
npm run test
```

# Dependencies
We use a [basic ORM for DynamoDB](https://github.com/serverless-seoul/dynamorm)

It's pretty lightweight. The main benefit is it gives you type checks and editor Intellisense when using the models. It also let's you define the structure of your tables in Typescript.

# Data Model
```fundamental
=== Collections Table ===
Purpose: Stores metadata about collections to display
Partition key: address
Sort key: name (enables prefix searching)
Local Secondary Index: lowercase name (enables prefix searching)
Local Secondary Index: symbol (enables prefix searching)
Attributes: { name, symbol, slug, logo, links, etc }

=== Metrics Table ===
Purpose: Stores most recent metrics datapoints for sorting Collections by metric
Partition key: address
Sort key: NULL
Attributes: { metric_name, metric_value, chain }
Global Secondary Index: metric_name#metric_value (Sort all collections by metric-value)
Global Secondary Index: chain#metric_name#metric_value (Query+Sort all collections by chain-metric-value)

=== Sales Table ===
Purpose: Stores raw data to derive metrics offline + show feed of sales
Partition key: address
Sort Key: timestamp
Attributes: { fromAddress, toAddress, marketplace, tokenAddress }

=== Historical Metrics ===
Purpose: Stores timeseries data for graphing metrics over time
Partition key: address
Sort Key: timestamp
Global Secondary Index: chain#timestamp (To graph metrics by chain)
```