'use strict';

var _ = require('lodash'),
    logger = require('../util/logger.js')('artillery-stack');

function getVpcOptions(vpc) {
    if (!vpc) return {};

    if (!vpc.subnets || !vpc.securityGroupIds) {
        throw new Error('Invalid VPC config settings for Lambda: VPC config should have subnets and securityGroupIds initialized');
    }

    return {
        SubnetIds: Array.isArray(vpc.subnets) ? vpc.subnets : vpc.subnets.split(','),
        SecurityGroupIds: Array.isArray(vpc.securityGroupIds) ? vpc.securityGroupIds : vpc.securityGroupIds.split(',')
    };
}

function getRoleOptions(options) {
    if (options.roleArn) {
        logger.log('using pre-defined role:', options.roleArn);
        return options.roleArn;
    }

    return {
        'Fn::GetAtt': ['role', 'Arn']
    };
}

module.exports = function (options) {
    var role = require('./role.js')(options),
        template = {
            AWSTemplateFormatVersion: '2010-09-09',
            Description: 'Store Reserve Service Stack used for Test and Prod environments.',
            Resources: {
                artillery: {
                    Type: 'AWS::Lambda::Function',
                    DependsOn: options.roleArn ? undefined : ['role'],
                    Properties: {
                        FunctionName: options.functionName,
                        Code: {
                            S3Bucket: options.s3Bucket,
                            S3Key: options.s3Path + options.fileName
                        },
                        Description: 'Artillery-Core based Lambda function for performance tests',
                        Handler: 'index.handler',
                        MemorySize: options.memorySize,
                        Runtime: options.runtime,
                        Timeout: options.timeout,
                        VpcConfig: getVpcOptions(options.vpc),
                        Role: getRoleOptions(options)
                    }
                }
            }
        };

    if (!options.roleArn) {
        template.Resources.role = role;
    }

    return _.identity(template);
};
