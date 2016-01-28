/*
Copyright 2016-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
(function() {
  'use strict';

  function LogMsg(type, content){
    this.type = type;
    this.content = content;
    this.createdTime = Date.now();
    if (this.type === 'success') {
      this.className = 'list-group-item-info';
    } else {
      this.className = 'list-group-item-danger';
    }
  }

  function LogService(){
    this.logs = [];
  }

  LogService.prototype.log = function(msg) {
    var logObj = new LogMsg('success', msg);
    this.logs.push(logObj);
  };

  LogService.prototype.logError = function(msg) {
    var logObj = new LogMsg('error', msg);
    this.logs.push(logObj);
  };

  /**
   * wrapper of received paho message
   * @class
   * @param {Paho.MQTT.Message} msg
   */
  function ReceivedMsg(msg) {
    this.msg = msg;
    this.content = msg.payloadString;
    this.destination = msg.destinationName;
    this.receivedTime = Date.now();
  }

  /** controller of the app */
  function AppController(scope){
    this.clientId = 'someClientId';
    this.endpoint = null;
    this.accessKey = null;
    this.secretKey = null;
    this.regionName = 'us-east-1';
    this.logs = new LogService();
    this.clients = new ClientControllerCache(scope, this.logs);
  }

  AppController.$inject = ['$scope'];

  AppController.prototype.createClient = function() {
    var options = {
      clientId : this.clientId,
      endpoint: this.endpoint.toLowerCase(),
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      regionName: this.regionName
    };
    var client = this.clients.getClient(options);
    if (!client.connected) {
      client.connect(options);
    }
  };

  AppController.prototype.removeClient = function(clientCtr) {
    this.clients.removeClient(clientCtr);
  };

  // would be better to use a seperate derective
  function ClientController(client, logs) {
    this.client = client;
    this.topicName = 'seattle/traffic';
    this.message = null;
    this.msgs = [];
    this.logs = logs;
    var self = this;

    this.client.on('connectionLost', function(){
      self.logs.logError('Connection lost');
    });
    this.client.on('messageArrived', function(msg){
      self.logs.log('messageArrived in ' + self.id);
      self.msgs.push(new ReceivedMsg(msg));
    });
    this.client.on('connected', function(){
      self.logs.log('connected');
    });
    this.client.on('subscribeFailed', function(e){
      self.logs.logError('subscribeFailed ' + e);
    });
    this.client.on('subscribeSucess', function(){
      self.logs.log('subscribeSucess');
    });
    this.client.on('publishFailed', function(e){
      self.logs.log('publishFailed');
    });
  }

  ClientController.prototype.subscribe = function() {
    this.client.subscribe(this.topicName);
  };

  ClientController.prototype.publish = function() {
    this.client.publish(this.topicName, this.message);
  };

  ClientController.prototype.msgInputKeyUp = function($event) {
    if ($event.keyCode === 13) {
      this.publish();
    }
  };


  function ClientControllerCache(scope, logs){
    this.scope = scope;
    this.logs = logs;
    this.val = [];
  }

  ClientControllerCache.prototype.getClient = function(options) {
    var id = options.accessKey + '>' + options.clientId + '@' + options.endpoint;
    for (var i = 0; i < this.val.length; i++) {
      var ctr = this.val[i];
      if (ctr.id === id) {
        return ctr.client;
      }
    }
    var client =  new MQTTClient(options, this.scope);
    var clientController = new ClientController(client, this.logs);
    clientController.id = id;
    this.val.push(clientController);
    return client;
  };

  ClientControllerCache.prototype.removeClient = function(clientCtr) {
    clientCtr.client.disconnect();
    var index = this.val.indexOf(clientCtr);
    this.val.splice(index, 1);
  };


  /**
   * utilities to do sigv4
   * @class SigV4Utils
   */
  function SigV4Utils(){}

  SigV4Utils.sign = function(key, msg){
    var hash = CryptoJS.HmacSHA256(msg, key);
    return hash.toString(CryptoJS.enc.Hex);
  };

  SigV4Utils.sha256 = function(msg) {
    var hash = CryptoJS.SHA256(msg);
    return hash.toString(CryptoJS.enc.Hex);
  };

  SigV4Utils.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
    var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
    return kSigning;
  };

  /**
  * AWS IOT MQTT Client
  * @class MQTTClient
  * @param {Object} options - the client options
  * @param {string} options.endpoint
  * @param {string} options.regionName
  * @param {string} options.accessKey
  * @param {string} options.secretKey
  * @param {string} options.clientId
  * @param {angular.IScope}  [scope]  - the angular scope used to trigger UI re-paint, you can
  omit this if you are not using angular
  */
  function MQTTClient(options, scope){
    this.options = options;
    this.scope = scope;

    this.endpoint = this.computeUrl();
    this.clientId = options.clientId;
    this.name = this.clientId + '@' + options.endpoint;
    this.connected = false;
    this.client = new Paho.MQTT.Client(this.endpoint, this.clientId);
    this.listeners = {};
    var self = this;
    this.client.onConnectionLost = function() {
      self.emit('connectionLost');
      self.connected = false;
    };
    this.client.onMessageArrived = function(msg) {
      self.emit('messageArrived', msg);
    };
    this.on('connected', function(){
      self.connected = true;
    });
  }

  /**
   * compute the url for websocket connection
   * @private
   *
   * @method     MQTTClient#computeUrl
   * @return     {string}  the websocket url
   */
  MQTTClient.prototype.computeUrl = function(){
    // must use utc time
    var time = moment.utc();
    var dateStamp = time.format('YYYYMMDD');
    var amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';
    var service = 'iotdevicegateway';
    var region = this.options.regionName;
    var secretKey = this.options.secretKey;
    var accessKey = this.options.accessKey;
    var algorithm = 'AWS4-HMAC-SHA256';
    var method = 'GET';
    var canonicalUri = '/mqtt';
    var host = this.options.endpoint;

    var credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
    canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope);
    canonicalQuerystring += '&X-Amz-Date=' + amzdate;
    canonicalQuerystring += '&X-Amz-Expires=86400';
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';

    var canonicalHeaders = 'host:' + host + '\n';
    var payloadHash = SigV4Utils.sha256('');
    var canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;
    console.log('canonicalRequest ' + canonicalRequest);

    var stringToSign = algorithm + '\n' +  amzdate + '\n' +  credentialScope + '\n' +  SigV4Utils.sha256(canonicalRequest);
    var signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);
    console.log('stringToSign-------');
    console.log(stringToSign);
    console.log('------------------');
    console.log('signingKey ' + signingKey);
    var signature = SigV4Utils.sign(signingKey, stringToSign);

    canonicalQuerystring += '&X-Amz-Signature=' + signature;
    var requestUrl = 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
    return requestUrl;
  };

  /**
  * listen to client event, supported events are connected, connectionLost,
  * messageArrived(event parameter is of type Paho.MQTT.Message), publishFailed,
  * subscribeSucess and subscribeFailed
  * @method     MQTTClient#on
  * @param      {string}  event
  * @param      {Function}  handler
  */
  MQTTClient.prototype.on = function(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  };

  /** emit event
   *
   * @method MQTTClient#emit
   * @param {string}  event
   * @param {...any} args - event parameters
   */
  MQTTClient.prototype.emit = function(event) {
    var listeners = this.listeners[event];
    if (listeners) {
      var args = Array.prototype.slice.apply(arguments, [1]);
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        listener.apply(null, args);
      }
      // make angular to repaint the ui, remove these if you don't use angular
      if(this.scope && !this.scope.$$phase) {
        this.scope.$digest();
      }
    }
  };

  /**
   * connect to AWS, should call this method before publish/subscribe
   * @method MQTTClient#connect
   */
  MQTTClient.prototype.connect = function() {
    var self = this;
    var connectOptions = {
      onSuccess: function(){
        self.emit('connected');
      },
      useSSL: true,
      timeout: 3,
      mqttVersion:4,
      onFailure: function() {
        self.emit('connectionLost');
      }
    };
    this.client.connect(connectOptions);
  };

  /**
   * disconnect
   * @method MQTTClient#disconnect
   */
  MQTTClient.prototype.disconnect = function() {
    this.client.disconnect();
  };

  /**
   * publish a message
   * @method     MQTTClient#publish
   * @param      {string}  topic
   * @param      {string}  payload
   */
  MQTTClient.prototype.publish = function(topic, payload) {
    try {
      var message = new Paho.MQTT.Message(payload);
      message.destinationName = topic;
      this.client.send(message);
    } catch (e) {
      this.emit('publishFailed', e);
    }
  };

  /**
   * subscribe to a topic
   * @method     MQTTClient#subscribe
   * @param      {string}  topic
   */
  MQTTClient.prototype.subscribe = function(topic) {
    var self = this;
    try{
      this.client.subscribe(topic, {
        onSuccess: function(){
          self.emit('subscribeSucess');
        },
        onFailure: function(){
          self.emit('subscribeFailed');
        }
      });
    }catch(e) {
      this.emit('subscribeFailed', e);
    }

  };

  angular.module('awsiot.sample', []).controller('AppController', AppController);
})();