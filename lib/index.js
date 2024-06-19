'use strict';

const Schema = require('./Schema');
const Model = require('./Model');
const { Agent } = require('https');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

var debug = require('debug')('dynamoose');

function createLocalDb(endpointURL, region) {
  const dbConfig = {};
  if (endpointURL) {
    dbConfig.endpoint = endpointURL;
  }
  if (region) {
    dbConfig.region = region;
  }
  return new DynamoDBClient(dbConfig);
}

function Dynamoose () {
  this.models = {};

  this.defaults = {
    create: true,
    waitForActive: true, // Wait for table to be created
    waitForActiveTimeout: 180000, // 3 minutes
    prefix: '', // prefix_Table
    suffix: '' // Table_suffix
  }; // defaults
}

Dynamoose.prototype.model = function(name, schema, options) {
  options = options || {};

  for(var key in this.defaults) {
    options[key] = (typeof options[key] === 'undefined') ? this.defaults[key] : options[key];
  }

  name = options.prefix + name + options.suffix;

  debug('Looking up model %s', name);

  if(this.models[name]) {
    return this.models[name];
  }
  if (!(schema instanceof Schema)) {
    schema = new Schema(schema, options);
  }

  var model = Model.compile(name, schema, options, this);
  this.models[name] = model;
  return model;
};

/**
 * The Mongoose [VirtualType](#virtualtype_VirtualType) constructor
 *
 * @method VirtualType
 * @api public
 */

Dynamoose.prototype.VirtualType = require('./VirtualType');

// Dynamoose.prototype.AWS = AWS;

Dynamoose.prototype.local = function (url, region) {
  this.endpointURL = url || 'http://localhost:8000';
  this.endpointRegion = region || this.endpointRegion;
  this.dynamoDB = createLocalDb(this.endpointURL, this.endpointRegion);
  debug('Setting DynamoDB to local (%s)', this.endpointURL);
};

Dynamoose.prototype.setRegion = function (region) {
  this.endpointRegion = region;
  this.dynamoDocumentClient = null;
  this.dynamoDB = null;
};

/**
 * Document client for executing nested scans
 */
Dynamoose.prototype.documentClient = function() {
  if (this.dynamoDocumentClient) {
    return this.dynamoDocumentClient;
  }

  this.dynamoDocumentClient = new DynamoDBDocumentClient.from(Dynamoose.prototype.ddb());
  return this.dynamoDocumentClient;
};

Dynamoose.prototype.setDocumentClient = function(documentClient) {
	debug('Setting dynamodb document client');
	this.dynamoDocumentClient = documentClient;
};

Dynamoose.prototype.ddb = function () {
  if(this.dynamoDB) {
    return this.dynamoDB;
  }

  if(this.endpointURL) {
    debug('Setting DynamoDB to %s', this.endpointURL);
    this.dynamoDB = createLocalDb(this.endpointURL, this.endpointRegion);
  } else {
    debug('Getting default DynamoDB');
    const dbConfig = {
      requestHandler: new NodeHttpHandler({
        httpsAgent: new Agent({
          rejectUnauthorized: true,
          keepAlive: true
        })
      })
    };
    if (this.endpointRegion) {
      dbConfig.region = this.endpointRegion;
    }
    this.dynamoDB = new DynamoDBClient(dbConfig);
  }
  return this.dynamoDB;
};

Dynamoose.prototype.setDefaults = function (options) {

  for(var key in this.defaults) {
    options[key] = (typeof options[key] === 'undefined') ? this.defaults[key] : options[key];
  }

  this.defaults = options;
};

Dynamoose.prototype.Schema = Schema;
Dynamoose.prototype.Table = require('./Table');
Dynamoose.prototype.Dynamoose = Dynamoose;

module.exports = new Dynamoose();
