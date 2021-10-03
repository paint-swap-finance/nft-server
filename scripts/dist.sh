#!/bin/bash

stat dist || mkdir dist
zip dist/deploy.zip -r dist package.json package-lock.json index.html