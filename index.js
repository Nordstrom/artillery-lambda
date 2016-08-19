'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    glob = require('glob-promise'),
    fs = Promise.promisifyAll(require('fs')),
    aws = require('./lib/util/aws.js'),
    s3 = Promise.promisifyAll(new aws.S3()),
    lambda = new aws.Lambda(),
    cfn = require('cfn'),
    logger = require('./lib/util/logger.js')('reserve-performance'),
    localArtillery = require('./lib/function/index.js');

function initOptions(options) {
    return _.merge({
        localRun: false,
        memorySize: 1024,
        runtime: 'nodejs4.3',
        timeout: 300,
        region: 'us-west-2',
        rolePath: '/',
        resourcePrefix: '',
        fileName: ''
    }, options);
}

function deploy(options) {
    options = initOptions(options);

    return glob(__dirname + '/lib/*.zip')
        .then(function (files) {
            options.fileName = files && files[0] && files[0].replace(/^.*[\\\/]/, '');
            return fs.readFileAsync(files[0]);
        })
        .then(function (buffer) {
            logger.debug('Uploading Lambda code archive to S3');
            return s3.putObjectAsync({
                Bucket: options.s3Bucket,
                Key: options.s3Path + options.fileName,
                Body: buffer
            });
        })
        .then(function (s3result) {
            logger.debug('Lambda code archive is uploaded to S3 ' + options.s3Bucket, s3result);
        })
        .then(function () {
            logger.debug('Deploying performance stack to cloud..');
            return cfn({
                name: options.stackName,
                template: __dirname + '/lib/formation/artilleryLambda.js',
                params: options
            });
        });
}

// todo: add opportunity to run synchronous and asynchronous
function runScenarios(options) {
    logger.debug('Get promise to run scenarios.');

    function runSingleScenario(scenario, runLocal) {
        return new Promise(function (resolve, reject) {
            function _success(data) {
                logger.debug('Lambda successfully executed.');
                resolve({
                    name: scenario.name,
                    data: data
                });
            }

            function _failure(error) {
                logger.debug('Lambda execution failed');
                logger.debug(error);
                reject(error);
            }

            function handleResult(err, data) {
                logger.debug('Scenario finished.');
                if (err) {
                    console.log('error happened when calling Lambda!');
                    return _failure(err);
                }
                return _success(data);
            }

            if (runLocal) {
                localArtillery.handler(scenario, {}, handleResult);
            } else {
                lambda.invoke({
                    FunctionName: options.functionName,
                    Payload: JSON.stringify(scenario)
                }, handleResult);
            }
        });
    }

    logger.debug('Running ' + options.scenarios.length + ' scenario(s)...');
    return Promise.mapSeries(options.scenarios, function (scenario, index, length) {
            logger.info('Running ' + (index + 1) + ' scenario of ' + length);
            scenario.proxy = options.proxy;
            return runSingleScenario(scenario, options.localRun);
        })
        .then(function (results) {
            logger.debug('runScenarios is done:', results);
            return {
                artillery: results
            };
        });
}

function getStackTemplate(options) {
    logger.debug('getting stack template for options:\n', options);

    options = initOptions(options);
    return require(__dirname + '/lib/formation/artilleryLambda.js')(options);
}

function undeploy(options) {
    logger.debug('Undeploying performance stack...');
    return cfn.delete(options.stackName);
}

function run(options) {
    var promises = options.localRun
            ? [runScenarios]
            : [deploy, runScenarios, undeploy],
        message = options.localRun
            ? 'Local Run: Generating volume from local machine'
            : 'Remote Run: Generating volume with Lambda calls: synchronous Lambda call for each separate scenario.';

    options = initOptions(options);

    logger.debug(message);

    return Promise.mapSeries(promises, function (promise) {
        return promise(options);
    })
        .then(function (results) {
            return results[1].artillery;
        });
}

run.deploy = deploy;
run.undeploy = undeploy;
run.runScenarios = runScenarios;
run.getStackTemplate = getStackTemplate;

module.exports = run;