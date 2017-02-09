var awsIot = require('aws-iot-device-sdk');

function ClientControllerCache(scope, logs) {
    this.scope = scope;
    this.logs = logs;
    this.val = [];
}

ClientControllerCache.prototype.addClient = function (options) {
    var id = options.accessKey + '>' + options.clientId + '@' + options.endpoint;
    for (var i = 0; i < this.val.length; i++) {
        var ctr = this.val[i];
        if (ctr.id === id) {
            console.log("This clien already connected");
            ctr.logs.logError('This client is already connected');
            return ctr;
        }
    }
    var client = awsIot.device(options);
    client.name = options.clientId + '@' + options.endpoint;
    var clientController = new ClientController(client, this.logs, this.scope);
    clientController.id = id;
    this.val.push(clientController);
};

ClientControllerCache.prototype.removeClient = function (clientCtr) {
    clientCtr.client.end();
    var index = this.val.indexOf(clientCtr);
    this.val.splice(index, 1);
};