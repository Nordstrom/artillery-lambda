'use strict';

var _ = require('lodash'),
    artillery = require('artillery-core'),
    HttpsProxyAgent = require('https-proxy-agent'),
    AWS = require('aws-sdk'),
    request = require('request');

exports.handler = function runLoad(event, context, callback) {
    var runner = new artillery.runner(event);

    runner.on('phaseStarted', function (opts) {
        console.log('phase', opts.index, ':', opts.name ? opts.name : '', 'started, duration', opts.duration);
    });
    runner.on('phaseCompleted', function (opts) {
        console.log('phase', opts.index, ':', opts.name ? opts.name : '', 'complete');
    });
    runner.on('done', function (report) {
        var metricsToSave = [],
            valuableMetrics = _.pick(report.aggregate, ['latency', 'rps', 'errors', 'codes', 'scenarioDuration']);

        if (!event.metricNamespace) {
            return callback(null, valuableMetrics);
        }

        AWS.config.sslEnabled = true;
        AWS.config.httpOptions = {
            agent: event.proxy ? new HttpsProxyAgent(event.proxy) : undefined,
            timeout: 2000
        };

        function getOwnMetrics(item, metricPrefix, timestamp) {
            _.forOwn(item, function (value, key) {
                if (_.isObjectLike(value)) {
                    getOwnMetrics(value, metricPrefix + '-' + key.toString(), timestamp);
                }

                if (_.isNaN(+value) || !_.isFinite(+value)) return;

                metricsToSave.push({
                    MetricName: metricPrefix + '-' + key,
                    Dimensions: [{
                        Name: 'Environment',
                        Value: 'Dev'
                    }],
                    Timestamp: timestamp,
                    Value: value
                });
            });
        }

        getOwnMetrics(valuableMetrics, (event.name || ''), report.aggregate.timestamp);

        var params = {
                Namespace: event.metricNamespace,
                MetricData: metricsToSave
            },
            cloudwatch = new AWS.CloudWatch();

        try {
            cloudwatch.putMetricData(params, function (err) {
                if (err) {
                    console.log('CloudWatch.putMetricData failed with params:', params, '\n[error]:', err);
                    return callback(err, report);
                }
                return callback(null, valuableMetrics);
            });
        } catch (err) {
            console.log('ERROR HAPPENED when putting metrics to Cloud Watch');
            return callback(err, valuableMetrics);
        }
    });
    runner.run();
};
