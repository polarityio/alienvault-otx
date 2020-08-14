'use strict';

const request = require('request');
const _ = require('lodash');
const async = require('async');
const config = require('./config/config');
const fs = require('fs');

let Logger;
let requestWithDefaults;
let previousDomainRegexAsString = '';
let previousIpRegexAsString = '';
let domainBlocklistRegex = null;
let ipBlocklistRegex = null;

const BASE_URI = 'https://otx.alienvault.com/api/v1/indicators';
const MAX_DOMAIN_LABEL_LENGTH = 63;
const MAX_ENTITY_LENGTH = 100;
const MAX_TAGS_IN_SUMMARY = 5;

function _setupRegexBlocklists(options) {
  if (
    options.domainBlocklistRegex !== previousDomainRegexAsString &&
    options.domainBlocklistRegex.length === 0
  ) {
    Logger.debug('Removing Domain Blocklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlocklistRegex = null;
  } else {
    if (options.domainBlocklistRegex !== previousDomainRegexAsString) {
      previousDomainRegexAsString = options.domainBlocklistRegex;
      Logger.debug(
        { domainBlocklistRegex: previousDomainRegexAsString },
        'Modifying Domain Blocklist Regex'
      );
      domainBlocklistRegex = new RegExp(options.domainBlocklistRegex, 'i');
    }
  }

  if (
    options.ipBlocklistRegex !== previousIpRegexAsString &&
    options.ipBlocklistRegex.length === 0
  ) {
    Logger.debug('Removing IP Blocklist Regex Filtering');
    previousIpRegexAsString = '';
    ipBlocklistRegex = null;
  } else {
    if (options.ipBlocklistRegex !== previousIpRegexAsString) {
      previousIpRegexAsString = options.ipBlocklistRegex;
      Logger.debug({ ipBlocklistRegex: previousIpRegexAsString }, 'Modifying IP Blocklist Regex');
      ipBlocklistRegex = new RegExp(options.ipBlocklistRegex, 'i');
    }
  }
}

function doLookup(entities, options, cb) {
  let lookupResults = [];

  _setupRegexBlocklists(options);

  async.each(
    entities,
    function(entityObj, next) {
      if (_isInvalidEntity(entityObj) || _isEntityBlocklisted(entityObj, options)) {
        next(null);
      } else {
        _lookupEntity(entityObj, options, function(err, result) {
          if (err) {
            next(err);
          } else {
            lookupResults.push(result);
            Logger.debug({ result: result }, 'Checking the result values ');
            next(null);
          }
        });
      }
    },
    function(err) {
      cb(err, lookupResults);
    }
  );
}
function _isInvalidEntity(entityObj) {
  // AlienvaultOTX API does not accept entities over 100 characters long so if we get any of those we don't look them up
  if (entityObj.value.length > MAX_ENTITY_LENGTH) {
    return true;
  }

  // Domain labels (the parts in between the periods, must be 63 characters or less
  if (entityObj.isDomain) {
    const invalidLabel = entityObj.value.split('.').find((label) => {
      return label.length > MAX_DOMAIN_LABEL_LENGTH;
    });

    if (typeof invalidLabel !== 'undefined') {
      return true;
    }
  }

  return false;
}

function _isEntityBlocklisted(entityObj, options) {
  const blocklist = options.blocklist;

  Logger.trace({ blocklist: blocklist }, 'checking to see what blocklist looks like');

  if (_.includes(blocklist, entityObj.value.toLowerCase())) {
    return true;
  }

  if (entityObj.isIPv4 && !entityObj.isPrivateIP) {
    if (ipBlocklistRegex !== null) {
      if (ipBlocklistRegex.test(entityObj.value)) {
        Logger.debug({ ip: entityObj.value }, 'Blocked BlockListed IP Lookup');
        return true;
      }
    }
  }

  if (entityObj.isDomain) {
    if (domainBlocklistRegex !== null) {
      if (domainBlocklistRegex.test(entityObj.value)) {
        Logger.debug({ domain: entityObj.value }, 'Blocked BlockListed Domain Lookup');
        return true;
      }
    }
  }

  return false;
}

function _getUrl(entityObj) {
  let otxEntityType = null;
  // map entity object type to the OTX REST API type
  switch (entityObj.type) {
    case 'domain':
      otxEntityType = 'domain';
      break;
    case 'hash':
      otxEntityType = 'file';
      break;
    case 'IPv4':
      otxEntityType = 'IPv4';
      break;
  }

  return `${BASE_URI}/${otxEntityType}/${entityObj.value.toLowerCase()}/general`;
}

function _getRequestOptions(entityObj, options) {
  return {
    uri: _getUrl(entityObj),
    method: 'GET',
    headers: {
      'X-OTX-API-KEY': options.apiKey,
      Accept: 'application/json'
    },
    json: true
  };
}

function _lookupEntity(entityObj, options, cb) {
  const requestOptions = _getRequestOptions(entityObj, options);

  requestWithDefaults(requestOptions, function(err, response, body) {
    let errorObject = _isApiError(err, response, body, entityObj.value);
    if (errorObject) {
      cb(errorObject);
      return;
    }

    if (_isLookupMiss(response, body)) {
      return cb(null, {
        entity: entityObj,
        data: null
      });
    }

    Logger.debug({ body: body, entity: entityObj.value }, 'Printing out the results of Body ');

    if (typeof body.pulse_info === 'undefined') {
      Logger.error({ entity: entityObj.value }, 'Undefined pulse_info on body');
      return cb('Undefined pulse_info on body');
    }

    if (options.pulses === true && body.pulse_info.count === 0) {
      return cb(null, {
        entity: entityObj,
        data: null // this entity will be cached as a miss
      });
    }

    const allTags = _getPulseDiveTags(body);
    const tags = allTags.slice(0, MAX_TAGS_IN_SUMMARY);
    tags.unshift(body.pulse_info.count + (body.pulse_info.count === 1 ? ' pulse' : ' pulses'));
    if(allTags.length > MAX_TAGS_IN_SUMMARY){
      tags.push(`+${allTags.length - MAX_TAGS_IN_SUMMARY} tags`);
    }

    // The lookup results returned is an array of lookup objects with the following format
    cb(null, {
      // Required: This is the entity object passed into the integration doLookup method
      entity: entityObj,
      // Required: An object containing everything you want passed to the template
      data: {
        // Required: These are the tags that are displayed in your template
        summary: tags,
        // Data that you want to pass back to the notification window details block
        details: body
      }
    });
  });
}

function _getPulseDiveTags(body) {
  const tags = new Set();
  if (Array.isArray(body.pulse_info.pulses)) {
    for (let pulse of body.pulse_info.pulses) {
      if (Array.isArray(pulse.tags)) {
        for (let tag of pulse.tags) {
          tags.add(tag);
        }
      }
    }
  }
  return [...tags];
}

function _isLookupMiss(response, body) {
  return (
    response.statusCode === 404 ||
    response.statusCode === 500 ||
    response.statusCode === 400 ||
    typeof body === 'undefined' ||
    typeof body.pulse_info === 'undefined'
  );
}

function _isApiError(err, response, body, entityValue) {
  if (err) {
    return {
      detail: 'Error executing HTTP request',
      error: err
    };
  }

  if (response.statusCode === 500) {
    return _createJsonErrorPayload(
      'AlienVault OTX Server 500 error',
      null,
      '500',
      '1',
      'AlienVault OTX Server 500 error',
      {
        err: err,
        entityValue: entityValue
      }
    );
  }

  // Any code that is not 200 and not 404 (missed response) or 400, we treat as an error
  if (response.statusCode !== 200 && response.statusCode !== 404 && response.statusCode !== 400) {
    return _createJsonErrorPayload(
      'Unexpected HTTP Status Code',
      null,
      response.statusCode,
      '1',
      'Unexpected HTTP Status Code',
      {
        err: err,
        body: body,
        entityValue: entityValue
      }
    );
  }

  return null;
}

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide an AlienVaultOTX API key'
    });
  }

  if (
    typeof userOptions.domainBlocklistRegex.value === 'string' &&
    userOptions.domainBlocklistRegex.value.length > 0
  ) {
    try {
      new RegExp(userOptions.domainBlocklistRegex.value);
    } catch (error) {
      errors.push({
        key: 'domainBlocklistRegex',
        message: error.toString()
      });
    }
  }

  if (
    typeof userOptions.ipBlocklistRegex.value === 'string' &&
    userOptions.ipBlocklistRegex.value.length > 0
  ) {
    try {
      new RegExp(userOptions.ipBlocklistRegex.value);
    } catch (e) {
      errors.push({
        key: 'ipBlocklistRegex',
        message: error.toString()
      });
    }
  }

  cb(null, errors);
}

// function that takes the ErrorObject and passes the error message to the notification window
function _createJsonErrorPayload(msg, pointer, httpCode, code, title, meta) {
  return {
    errors: [_createJsonErrorObject(msg, pointer, httpCode, code, title, meta)]
  };
}

// function that creates the Json object to be passed to the payload
function _createJsonErrorObject(msg, pointer, httpCode, code, title, meta) {
  let error = {
    detail: msg,
    status: httpCode.toString(),
    title: title,
    code: 'OTX_' + code.toString()
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
}

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

  if (typeof config.request.rejectUnauthorized === 'boolean') {
    defaults.rejectUnauthorized = config.request.rejectUnauthorized;
  }

  requestWithDefaults = request.defaults(defaults);
}

module.exports = {
  doLookup: doLookup,
  startup: startup,
  validateOptions: validateOptions
};
