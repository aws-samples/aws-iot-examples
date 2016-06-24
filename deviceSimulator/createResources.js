const createRule = require('./createRule');
const createIndex = require('./createIndex');
const AWS = require('aws-sdk');
const async = require('async');

var index_name;

function createResources(event, callback) {

  const credentials = new AWS.Credentials(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY, process.env.AWS_SESSION_TOKEN);

  const options = {
    credentials: credentials,
    region: process.env.AWS_REGION
  };

  const es = new AWS.ES(options);
  const iot = new AWS.Iot(options);
  const iam = new AWS.IAM(options);

  const domainName = event.esDomainArn.split('/')[1];

  var index;

  const params = {
    endpoint: event.esEndpoint,
    domainArn: event.esDomainArn,
    domainName: domainName
  };

  async.waterfall([
    (next) => createIndex(params, next),
    (results, next) => {
      index_name = results.index;
      console.log('results.index : ' + index_name);
      createRule(iot, iam, results, event.topic, next);
    }
  ], (err, data) => {
    if (err) {
      return callback(err);
    }
    console.log('data.index : ' + index_name);
    data.index = index_name;
    return callback(null, data);
  });
}

function getIndex(index) {

}

module.exports = createResources;
