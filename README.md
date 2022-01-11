# What It Does

Runs a Node process on Elastic Beanstalk to harvest NFT data from various sources with a child process for each adapter. Also uses AWS Lambda for the API. Uses DynamoDB as the database. 

# How It Does

The gist is the program runs multiple adapters on a continuous loop. Each adapter collects data from a different data source e.g. Opensea or the Ethereum Blockchain.

# How To Run Locally

You need to run DynamoDB locally:
```bash
brew cask install docker
docker-compose up
```

You will need to manually create the DynamoDB table locally, the structure for which can be found
in `resources/dynamodb-table.yml`. You also need to create a `.env` file locally, and the variables
expected for this can be found in `env.js`. 

Then you can run the adapters:
```bash
npm run build && npm run start &> adapters.log 
```

To run the API locally, you can run:
```bash
npm run dev &> api.log
```

This will simulate the lambdas locally using serverless, so some of the lambdas won't work as expected such as addSearchDocuments since stream events from your local DynamoDB instance don't seem to be supported. You can deploy to a dev environment on AWS to test this instead.
