# JSON to HL7

## Pre-requisites
- Docker
- Docker Compose
- Node

## Getting started
- clone the project
- then cd into the project and run `npm run docker:up`
- Use swagger: `http://localhost:3000/api`

## Actions
- Use the included `JsonPatientFile.json` file, upload it on the only available route for patient addmission then you should receive an HL7 V2 message as a result in a ZIP file.


## To-Do
- It wasn't clear enough for me to understand how to proceed on the ADT-A40 part