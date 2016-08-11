'use strict';

var HttpsProxyAgent = require('https-proxy-agent'),
    logger = require('./logger.js')('aws'),
    AWS = require('aws-sdk'),
    PROXY = process.env.PROXY,
    PROFILE = process.env.AWS_PROFILE,
    REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

AWS.config.region = REGION;

if (PROFILE) {
    AWS.config.sslEnabled = true;
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
        profile: PROFILE
    });
    logger.info('Using AWS for Profile %s with Region %s using %s',
        PROFILE, REGION, PROXY ? ('Proxy ' + PROXY) : 'No Proxy');
} else {
    AWS.config.credentials = new AWS.EC2MetadataCredentials({
        httpOptions: {timeout: 2000} // 1 sec timeout
    });
}

AWS.config.httpOptions = {
    agent: PROXY ? new HttpsProxyAgent(PROXY) : undefined
};

module.exports = AWS;
