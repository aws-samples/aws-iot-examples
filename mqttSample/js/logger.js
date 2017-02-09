function LogMsg(type, content) {
    this.type = type;
    this.content = content;
    this.createdTime = Date.now();
    if (this.type === 'success') {
        this.className = 'list-group-item-info';
    } else if (this.type == 'warning') {
        this.className = 'list-group-item-warning';
    } else {
        this.className = 'list-group-item-danger';
    }
}

/** Log service */
function LogService() {
    this.logs = [];
}

LogService.prototype.log = function (msg) {
    var logObj = new LogMsg('success', msg);
    this.logs.push(logObj);
};

LogService.prototype.logError = function (msg) {
    var logObj = new LogMsg('error', msg);
    this.logs.push(logObj);
};

LogService.prototype.logWarning = function (msg) {
    var logObj = new LogMsg('warning', msg);
    this.logs.push(logObj);
};
