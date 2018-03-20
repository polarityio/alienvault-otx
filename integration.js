'use strict';

let request = require('request');
let _ = require('lodash');
let util = require('util');
let net = require('net');
let async = require('async');
let config = require('./config/config');
let fs = require('fs');
let Logger;
let requestWithDefaults;
let previousDomainRegexAsString = '';
let previousIpRegexAsString = '';
let domainBlacklistRegex = null;
let ipBlacklistRegex = null;

const BASE_URI = 'https://otx.alienvault.com/api/v1/indicators';


function _setupRegexBlacklists(options){
    if (options.domainBlacklistRegex !== previousDomainRegexAsString && options.domainBlacklistRegex.length === 0) {
        log.debug("Removing Domain Blacklist Regex Filtering");
        previousDomainRegexAsString = '';
        domainBlacklistRegex = null;
    } else {
        if (options.domainBlacklistRegex !== previousDomainRegexAsString) {
            previousDomainRegexAsString = options.domainBlacklistRegex;
            log.debug({domainBlacklistRegex: previousDomainRegexAsString}, "Modifying Domain Blacklist Regex");
            domainBlacklistRegex = new RegExp(options.domainBlacklistRegex, 'i');
        }
    }

    if (options.ipBlacklistRegex !== previousIpRegexAsString && options.ipBlacklistRegex.length === 0) {
        log.debug("Removing IP Blacklist Regex Filtering");
        previousIpRegexAsString = '';
        ipBlacklistRegex = null;
    } else {
        if (options.ipBlacklistRegex !== previousIpRegexAsString) {
            previousIpRegexAsString = options.ipBlacklistRegex;
            log.debug({ipBlacklistRegex: previousIpRegexAsString}, "Modifying IP Blacklist Regex");
            ipBlacklistRegex = new RegExp(options.ipBlacklistRegex, 'i');
        }
    }
}


function doLookup(entities, options, cb) {

    var blacklist = options.blacklist;
    Logger.trace({blacklist: blacklist}, "checking to see what blacklist looks like");

    let entitiesWithNoData = [];
    let lookupResults = [];

    if(typeof(options.apiKey) !== 'string' || options.apiKey.length === 0){
        cb("The API key is not set.");
        return;
    }

    async.each(entities, function (entityObj, next) {

      _setupRegexBlacklists(options);

        if (_.includes(blacklist, entityObj.value)) {
                rnext(null);
        }
        else if (entityObj.isIPv4 && !entityObj.isPrivateIP)
         {
           if (ipBlacklistRegex !== null) {
                if (ipBlacklistRegex.test(entityObj.value)) {
                    log.debug({ip: entityObj.value}, 'Blocked BlackListed IP Lookup');
                    return next(null);
                }
            }
            _lookupEntity(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); Logger.debug({result: result}, "Checking the result values ");
                    next(null);
                }
            });
        } else if (entityObj.isHash)
        {
            _lookupEntityHash(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); Logger.debug({result: result}, "Checking the result values ");
                    next(null);
                }
            });
        } else if (entityObj.isDomain)
        {
          if (domainBlacklistRegex !== null) {
                if (domainBlacklistRegex.test(entityObj.value)) {
                    log.debug({domain: entityObj.value}, 'Blocked BlackListed Domain Lookup');
                    return next(null);
                }
            }
            _lookupEntityDomain(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); Logger.debug({result: result}, "Checking the result values ");
                    next(null);
                }
            });
        }else {
            lookupResults.push({entity: entityObj, data: null}); //Cache the missed results
            next(null);
        }
    }, function (err) {
        cb(err, lookupResults);
    });
}


function _lookupEntity(entityObj, options, cb) {
    if(entityObj.value)
        request({
            uri: BASE_URI + '/IPv4/' + entityObj.value.toLowerCase() + '/general',
            method: 'GET',
            headers: {
                'X-OTX-API-KEY': options.apiKey,
                'Accept': 'application/json'
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(err);
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("Limit of number of concurrent connections is exceeded for AlienVaultOTX", null, '503', '2A', 'Concurrent Connections Exceeded', {
                    err: err
                }));
                return;
            }


            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Error processing your request", null, '500', '2A', 'Internal Server Error', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if(response.statusCode === 403){
                cb(_createJsonErrorPayload("You do not have permission to access AlienVaultOTX. Please check your API key", null, '403', '2A', 'Permission Denied', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if(response.statusCode === 400){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            Logger.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
                return;
            }

            if(!options.pulses && body.pulse_info.count === 0){
              cb(null, {
                  entity: entityObj,
                  data: null // this entity will be cached as a miss
                });
                return;
            }



            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: ["Number of Pulses:" + " " + body.pulse_info.count],
                    // Data that you want to pass back to the notification window details block
                    details: {
                        bodyObjects: body

                    }
                }
            });
        });
}

function _lookupEntityDomain(entityObj, options, cb) {

    if(entityObj.value)
        request({
            uri: BASE_URI + '/domain/' + entityObj.value.toLowerCase() + '/general',
            method: 'GET',
            headers: {
                'X-OTX-API-KEY': options.apiKey,
                'Accept': 'application/json'
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(err);
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("Limit of number of concurrent connections is exceeded for AlienVaultOTX", null, '503', '2A', 'Concurrent Connections Exceeded', {
                    err: err
                }));
                return;
            }


            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Error processing your request", null, '500', '2A', 'Internal Server Error', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if(response.statusCode === 403){
                cb(_createJsonErrorPayload("You do not have permission to access AlienVaultOTX. Please check your API key", null, '403', '2A', 'Permission Denied', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if(response.statusCode === 400){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }



            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            Logger.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
                return;
            }

            if(options.pulses !=true && body.pulse_info.count === 0){
              cb(null, {
                  entity: entityObj,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if(body.pulse_info.count === 0){
              cb(null, {
                  entity: entityObj,
                  data: null // this entity will be cached as a miss
                });
                return;
            }


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: ["Number of Pulses:" + " " + body.pulse_info.count],
                    // Data that you want to pass back to the notification window details block
                    details: {
                        bodyObjects: body
                    }
                }
            });
        });
}

function _lookupEntityHash(entityObj, options, cb) {

    if(entityObj.value)
        request({
            uri: BASE_URI + '/file/' + entityObj.value.toLowerCase() + '/general',
            method: 'GET',
            headers: {
                'X-OTX-API-KEY': options.apiKey,
                'Accept': 'application/json'
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(err);
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("Limit of number of concurrent connections is exceeded for AlienVaultOTX", null, '503', '2A', 'Concurrent Connections Exceeded', {
                    err: err
                }));
                return;
            }


            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Error processing your request", null, '500', '2A', 'Internal Server Error', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if(response.statusCode === 403){
                cb(_createJsonErrorPayload("You do not have permission to access AlienVaultOTX. Please check your API key", null, '403', '2A', 'Permission Denied', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if(response.statusCode === 400){
              done(null, {
                  entity: entity,
                  data: null // this entity will be cached as a miss
                });
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            Logger.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
                return;
            }

            if(!options.pulses && body.pulse_info.count === 0){
              cb(null, {
                  entity: entityObj,
                  data: null // this entity will be cached as a miss
                });
                return;
            }



            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: ["Number of Pulses:" + " " + body.pulse_info.count],
                    // Data that you want to pass back to the notification window details block
                    details: {
                        bodyObjects: body

                    }
                }
            });
        });
}
function validateOptions(userOptions, cb) {
    let errors = [];
    if(typeof userOptions.apiKey.value !== 'string' ||
        (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)){
        errors.push({
            key: 'apiKey',
            message: 'You must provide an AlienVaultOTX API key'
        })
    }

    cb(null, errors);
}

// function that takes the ErrorObject and passes the error message to the notification window
var _createJsonErrorPayload = function (msg, pointer, httpCode, code, title, meta) {
    return {
        errors: [
            _createJsonErrorObject(msg, pointer, httpCode, code, title, meta)
        ]
    }
};

// function that creates the Json object to be passed to the payload
var _createJsonErrorObject = function (msg, pointer, httpCode, code, title, meta) {
    let error = {
        detail: msg,
        status: httpCode.toString(),
        title: title,
        code: 'DNSDB_' + code.toString()
    };

    if (pointer) {
        error.source = {
            pointer: pointer
        };
    }

    if (meta) {
        error.meta = meta;
    }

    return error;
};

function startup(logger) {
    Logger = logger;
    let defaults = {};

    if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
        defaults.cert = fs.readFileSync(config.request.cert);
    }

    if (typeof config.request.key === 'string' && config.request.key.length > 0) {
        defaults.key = fs.readFileSync(config.request.key);
    }

    if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
        defaults.passphrase = config.request.passphrase;
    }

    if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
        defaults.ca = fs.readFileSync(config.request.ca);
    }

    if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
        defaults.proxy = config.request.proxy;
    }

    requestWithDefaults = request.defaults(defaults);
}

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};
