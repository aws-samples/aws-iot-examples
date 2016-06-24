const mqtt = require('./mqtt-lib.js');
const createResources = require('./createResources.js');
const AWS = require('aws-sdk');
const async = require('async');

const bucketName = 'iot-simulator-publicbucket';
const objectKey = 'physiological-data.csv';

var index_name;

exports.handler = (event, context) => {

  event.bucketName = event.bucketName? event.bucketName : bucketName;
  event.key = event.key? event.key : objectKey;
  event.region = event.region ? event.region : process.env.AWS_REGION;
  event.accessKey = process.env.AWS_ACCESS_KEY_ID;
  event.secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  event.sessionToken = process.env.AWS_SESSION_TOKEN;

  // 100 msgs/sec in total
  if (event.interval / event.numDevice < 10) {
    context.fail('Rate is too high');
    return;
  }

  createResources(event, (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    const s3 = new AWS.S3({
      region: 'us-east-1'
    });

    index_name = data.index;
    var bucket = event.bucketName;
    var key = decodeURIComponent(event.key).replace(/\+/g, " ");

    s3.getObject({
        Bucket: bucket,
        Key: key
    }, (err, data) => {
      if (err) {
        context.fail("Failed to read dataset");
        return;
      }
      event.data = data.Body.toString();      // attach file content to event
      const iot = new AWS.Iot();
      iot.describeEndpoint({}, (err, data) => {
        if (err) {
          console.log(err);
          return;
        }
        event.endpoint = data.endpointAddress;
        processText(event, context);
      });
    });
  });
};

function processText(params, context) {
  const mqttController = new mqtt.ClientControllerCache();
  const jsonData = parseData(params, params.numDevice);

  for (var i = 0; i < params.numDevice; i++) {

    var connectOpts = {
      accessKey: params.accessKey,
      clientId: `${Math.random().toString(36).substring(2,12)}`,      // 10-bit random string
      endpoint: params.endpoint,
      secretKey: params.secretKey,
      sessionToken: params.sessionToken,
      regionName: params.region,
      topic: params.topic
    };

    var simOpts = {
      simTime: params.simTime,
      interval: params.interval,
      index: i
    };

    createMqttClient(connectOpts, simOpts, mqttController, jsonData, context);
  }
}

function createMqttClient(connectOpts, simOpts, mqttController, jsonData, context) {
  var cbs = {
    onConnect: onConnect,
    onSubSuccess: onSubSuccess,
    onMessageArrived: onMessageArrived,
    onConnectionLost: onConnectionLost
  };

  var clientController = mqttController.getClient(connectOpts, cbs);

  function onConnect() {
    clientController.subscribe();
  }

  function onMessageArrived(data) {
    // do nothing
  }

  function onSubSuccess() {
    var index = 0;
    var interval = setInterval(() => {
      var line = jsonData[index++][simOpts.index];
      clientController.publish(line);
    }, simOpts.interval);

    setTimeout(() => {
      clearInterval(interval);
      clientController.disconnect();
      setTimeout(() => {          // set drain time to disconnect all connections
        console.log(`Simulation completed. See the results in Elasticsearch under index ${index_name}.`);
        context.succeed();
      }, 1000);
    }, simOpts.simTime);
  }

  function onConnectionLost() {
    // do nothing
  }
}

function parseData(params, numDevice) {
  var dataJSON = [];
  const lines = params.data.split('\n');
  var lineNumber = lines.length;

  for (var i = 0; i < lineNumber; i++) {
    var columns = lines[i].trim().split(',');
    var dev = [];
    for (var j = 0; j < numDevice; j++) {
      var clientId = 'client_' + j + '@' + params.endpoint;
      dev.push({
        clientId: clientId,
        field: columns[j]
      });
    }
    dataJSON.push(dev);
  }
  return dataJSON;
}
