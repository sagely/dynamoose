'use strict';

var dynamoose = require('../');
dynamoose.setRegion('us-east-1');
// dynamoose.AWS.config.update({
//   accessKeyId: 'AKID',
//   secretAccessKey: 'SECRET',
//   region: 'us-east-1'
// });

var should = require('should');

describe('Local DB tests', function () {
  afterEach(function() {
    dynamoose.local();
  });

  it('Change to local dynamo db', async function () {
    dynamoose.dynamoDB = undefined;
    var dynamoDB = dynamoose.ddb();

    var endpoint = await dynamoDB.config.endpoint();
    should.equal(endpoint.hostname, 'localhost');
    should.equal(endpoint.port, '8000');
    should.equal(endpoint.protocol, 'http:');

    var expectURL = 'http://localhost:9000/';
    dynamoose.local(expectURL);
    dynamoDB = dynamoose.ddb();

    endpoint = await dynamoDB.config.endpoint();
    should.equal(endpoint.hostname, 'localhost');
    should.equal(endpoint.port, '9000');
    should.equal(endpoint.protocol, 'http:');
   });
});
