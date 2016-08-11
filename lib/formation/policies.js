'use strict';

module.exports = function (options) {
    var prefix = options.resourcePrefix || 'LoadtestPolicy';
    return [{
            PolicyName: prefix + '-PutMetric',
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'cloudwatch:GetMetricData',
                            'cloudwatch:GetMetricStatistics',
                            'cloudwatch:PutMetricAlarm',
                            'cloudwatch:PutMetricData'
                        ],
                        Resource: ['*']
                    }
                ]
            }
        },
        {
            PolicyName: prefix + '-LambdaRun',
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    // Allows Lambda function to use ec2 instances network interfaces and run code
                    {
                        Effect: 'Allow',
                        Action: [
                            'ec2:*NetworkInterface*'
                        ],
                        Resource: '*'
                    },
                    // Allows Lambda function to put logs to CloudWatch logs
                    {
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        Effect: 'Allow',
                        Resource: 'arn:aws:logs:' + options.region + ':' + options.account + ':*:*:*'
                    }
                ]
            }
        },
        {
            PolicyName: prefix + '-SNS-SQS-PublishEvents',
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'sns:CreateTopic',
                            'sns:ListTopics',
                            'sns:SetTopicAttributes',
                            'sns:DeleteTopic',
                            'sns:Publish'
                        ],
                        Resource: 'arn:aws:sns:' + options.region + ':' + options.account + ':' + (options.resourcePrefix || '') + '*'
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'sqs:SendMessage',
                            'sqs:ReceiveMessage',
                            'sqs:ChangeMessageVisibility',
                            'sqs:DeleteMessage'
                        ],
                        Resource: 'arn:aws:sqs:' + options.region + ':' + options.account + ':' + (options.resourcePrefix || '') + '*'
                    }
                ]
            }
        }];
};
