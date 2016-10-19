# Artillery-Lambda
Deploys AWS Cloud Formation stack with Lambda function. Function code calls artillery runner (http://artillery.io) to execute performance scenarios.

## Installation
You should already have node.js installed. You also should already have AWS account with available services: CloudFormation, Lambda, S3.

$ npm install artillery-lambda

## Usage
```
var testRunner = require('artillery-lambda');
var options = {
        stackName: 'Artillery-Lambda-Stack',
    functionName: 'Performance-Tests-With-Artillery',
    s3Bucket: 'My-S3-Bucket',
    s3Path: '/lambda-code',
    roleArn: 'Lambda-Execution-Role-Arn',
 };
 var scenario = {
    name: 'SimpleLoadTest',
    config: {
        target: 'http://my.service.com',
       phases: [{
            arrivalRate: 20,
           duration: 20
        }],
    },
    scenarios: [{
        flow: [{
            get: {
                url: '/useful-endpoint'
            }
        }]
    }]
 };

 // Every scenario in options.scenarios array runs individually and does not affect load during other scenarios.
 options.scenarios = [scenario];

 return testRunner(options)
    .then(functions(aggregatedResults) {
        console.log(aggregatedResults);
    });
```

testRunner(options) returns promise to deploy CloudFormation stack with Lambda function, run options.scenarios and delete CloudFormation stack.