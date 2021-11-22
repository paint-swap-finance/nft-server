#!/bin/bash

npm run build
stat dist || mkdir dist
zip dist/deploy.zip -r dist package.json package-lock.json index.html
cd aws-infrastructure && cdk deploy --all