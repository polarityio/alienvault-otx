'use strict';

let request = require('request');
let _ = require('lodash');
let util = require('util');
let net = require('net');
let async = require('async');
var log = null;

const BASE_URI = 'https://otx.alienvault.com/api/v1/indicators';



function startup(logger){
    log = logger;
}

function doLookup(entities, options, cb) {

    var blacklist = options.blacklist;
    log.trace({blacklist: blacklist}, "checking to see what blacklist looks like");

    let entitiesWithNoData = [];
    let lookupResults = [];

    if(typeof(options.apiKey) !== 'string' || options.apiKey.length === 0){
        cb("The API key is not set.");
        return;
    }

    async.each(entities, function (entityObj, next) {
        if (_.includes(blacklist, entityObj.value)) {
                rnext(null);
        }
        else if (entityObj.isIPv4)// && options.lookupDomain)
         {
            _lookupEntity(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.debug({result: result}, "Checking the result values ");
                    next(null);
                }
            });
        } else if (entityObj.isHash)
        {
            _lookupEntityHash(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.debug({result: result}, "Checking the result values ");
                    next(null);
                }
            });
        } else if (entityObj.isDomain)
        {
            _lookupEntityDomain(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.debug({result: result}, "Checking the result values ");
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
                cb(_createJsonErrorPayload("Entity not found in DNSDB", null, '404', '2A', 'Entity not found', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            log.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
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
                cb(_createJsonErrorPayload("Entity not found in DNSDB", null, '404', '2A', 'Entity not found', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            log.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
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
                cb(_createJsonErrorPayload("Entity not found in DNSDB", null, '404', '2A', 'Entity not found', {
                    err: err,
                    entity: entityObj.value
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }
            log.debug({body: body}, "Printing out the results of Body ");


            if( body.length < 2){
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
            message: 'You must provide a Farsight DNSDB API key'
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

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};
