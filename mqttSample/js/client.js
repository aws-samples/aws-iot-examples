
/**
 * wrapper of received paho message
 * @class
 * @param {Paho.MQTT.Message} msg
 */
function ReceivedMsg(msg, destination) {
    this.content = msg.toString();
    this.destination = destination;
    this.receivedTime = Date.now();
}

/** Client controller */
function ClientController(client, logs, scope) {
    _client = client;
    this.client = client;
    this.message = null;
    this.msgs = [];
    this.listeners = [];
    this.topics = [];
    this.logs = logs;
    this.scope = scope;
    var self = this;

    // Mqtt events
    this.client.reconnecting = false;
    this.client.on('connect', function () {
        self.client.connected = true;
        console.log('Connected');
        self.emit('connected');
    });
    this.client.on('message', function (topic, playload) {
        console.log('Income message', topic, playload);
        self.emit('messageArrived', topic, playload);
    });

    // Client controller events
    this.client.on('close', function () {
        self.client.connected = false;
        console.log('Connection closed');
        self.emit('connectionLost');
    });
    this.client.on('error', function (error) {
        console.log('Error', error);
        self.client.connected = false;
        self.emit('error');
    });
    this.client.on('reconnect', function () {
        self.emit('reconnect');
        self.client.attemptedReconnect = true;
    });

    this.on('connectionLost', function () {
        self.logs.logError('Connection lost');
    });
    this.on('messageArrived', function (topic, playload) {
        self.msgs.push(new ReceivedMsg(playload, topic));
        self.logs.log('New message', topic, playload);
    });
    this.on('connected', function () {
        self.logs.log('Connected');
    });
    this.on('subscribeFailed', function (e) {
        self.logs.logError('subscribeFailed ' + e);
    });
    this.on('alreadySubscribed', function () {
        self.logs.logWarning('Already subscribed on this topic');
    });
    this.on('subscribeSucess', function () {
        self.logs.log('Successfull subscribe');
    });
    this.on('error', function (e) {
        self.logs.log('Some error occured' + e);
    });
    this.on('reconnect', function () {
        self.logs.logWarning('Attemping to reconnect');
    });
}

/** emit event
 *
 * @method ClientController#emit
 * @param {string}  event
 * @param {...any} args - event parameters
 */
ClientController.prototype.emit = function (event) {
    var listeners = this.listeners[event];
    if (listeners) {
        var args = Array.prototype.slice.apply(arguments, [1]);
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener.apply(null, args);
        }
        // make angular to repaint the ui, remove these if you don't use 
        if (this.scope && !this.scope.$$phase) {
            this.scope.$digest();
        }
    }
};

/**
 * listen to client event, supported events are connected, connectionLost,
 * messageArrived(event parameter is of type Paho.MQTT.Message), publishFailed,
 * subscribeSucess and subscribeFailed
 * @method     ClientController#on
 * @param      {string}  event
 * @param      {Function}  handler
 */
ClientController.prototype.on = function (event, handler) {
    if (!this.listeners[event]) {
        this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
};

ClientController.prototype.subscribe = function () {
    var self = this;
    if (this.topics.indexOf(this.topicName) > -1) {
        console.log('Already subscribed');
        self.emit('alreadySubscribed');
        return;
    }
    try {
        this.client.subscribe(this.topicName, 0, function (err, granted) {
            if (err) {
                console.log(err);
                self.emit('subscribeFailed', e);
            }
            self.topics.push(self.topicName);
            console.log('Successful subscribe');
            self.emit('subscribeSucess');
        });
    } catch (e) {
        console.log(e);
        this.emit('subscribeFailed', e);
    }
};

ClientController.prototype.publish = function () {
    this.client.publish(this.topicName, this.message);
    this.logs.log('Message sent', this.topicName, this.message);
    this.message = '';
};

ClientController.prototype.msgInputKeyUp = function ($event) {
    if ($event.keyCode === 13) {
        this.publish();
    }
};
