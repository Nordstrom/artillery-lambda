'use strict';

var policiesCtor = require('./policies.js');

module.exports = function (opts) {
    var policies = policiesCtor(opts);
    return {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2008-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]
            },
            Path: opts.rolePath,
            Policies: policies
        }
    };
};
