# Reserve-performance

## Goals
This package deploys "artillery"-based lambda function to AWS Cloud and run pre-defined scenarios.

## Environment Variables
Make sure to add the following to your ~/.bash_profile and then reopen your terminal...

```
export NO_PROXY=$no_proxy
export AWS_PROFILE="nordstrom-federated"
export AWS_REGION="us-west-2"
export PROXY=http://webproxysea.nordstrom.net:8181
```

If you want to see logs in console instead of "app.log" file use LOG_LOCATION=console environment variable

## Setup

1. Install [node](http://nodejs.org)
2. Get the latest code from this repo
3. If it is your first time to use this repo, run

```
$ setup
```

4. Otherwise, run

```
$ init
```

## Run Load test
To run AWS cloud based load test you need to have AWS account. As input test options you need to define next:

```
var options = {
        stackName: 'STACK_NAME',
        functionName: 'LAMBDA_FUNCTION_NAME',
        fileName: 'LAMBDA_ZIP_FILE_NAME',
        s3Bucket: 'BUCKET_NAME',
        s3Path: 'FOLDER_PATH_TO_ZIP',
        prefix: prefix,
        memorySize: 1024,       // optional, default value = 1024
        runtime: 'nodejs4.3',   // optional, default value = 'nodejs4.3'
        timeout: 300,           // optional, default value = 300
        vpc: {
            subnets: 'subnet-abcd1234,subnet-12ytrewq',
            securityGroupIds: 'sg-qwerty12'
        },
        // roleArn: 'arn:aws:iam::123456789098:role/ANY/YOUR/PATH/LAMBDA_IAM_EXECUTION_ROLE',
        rolePath: '/ANY/YOUR/PATH/', // optional, default value = ''
        region: 'us-west-2',
        account: '123456789098',
        resourcePrefix: 'RESOURCE_PREFIX', // optional, default value = ''
        scenarios: [{
            name: 'FellingLucky',
            metricNamespace: 'MyFunny-Feeling-lucky-test',
            config: {
                target: "http://google.com",
                tls: {
                    rejectUnauthorized: true
                },
                phases: [{
                    arrivalRate: 70,
                    duration: 10
                }],
                defaults: {
                    headers: {
                        'content-type': 'text/html; charset=UTF-8'
                    }
                }
            },
            scenarios: [{
                flow: [{
                    get: {
                        url: '/search?q=feeling+lucky'
                    }
                }]
            }]
        }]
};
```

If your test endpoints are not located in VPC you can undefine vpc param. Otherwise use for vpc.subnets and vpc.securityGroupIds comma-separated values or arrays.
If IAM role you want to use for Lambda exists just pass its ARN in options as roleArn. Otherwise Lambda execution role will be created and removed with stack.
Scenarios variable is regular Artillery-Core scenarios object with name and metricNamespace for better tracking AWS Cloudwatch metrics.

### Run loadtest example which deploys Lambda-stack, runs load tests and removes Lambda-stack
```
var loadtest = require('artillery-lambda'),
    options = {...}; // AWS configuration options for Lambda and scenarios

return loadtest(options);
```

## Create stack once
```
var loadtest = require('artillery-lambda');

function createStack() {
    var options = {...}; // no need to specify scenarios here
    return loadtest.deploy(options);
}

function runLoadtest() {
    var options = {...}; // options with scenarios
    return loadtest.runScenarios(options);
}

function removeStack() {
    var options = {...}; // stackName only
    return loadtest.undeploy(options);
}
```

### Generate load from your local machine instead of Lambda
With localRun = true load is artillery-core run pus CloudWatch metrics. All load is generated from running machine.

```
var options = {
        localRun: true
    },
    loadtest = require('artillery-lambda');
return loadtest(options);
```