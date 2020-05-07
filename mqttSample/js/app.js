/*
 Copyright 2016-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 
 http://aws.amazon.com/apache2.0/
 
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
(function () {
        'use strict';

        /** controller of the app */
        function AppController(scope) {
                this.scope = scope;
                this.logs = new LogService();
                this.clients = new ClientControllerCache(scope, this.logs);
        }

        AppController.$inject = ['$scope'];

        AppController.prototype.createClient = function () {

                console.log('Trying to connect with Identity ID: ' + this.identityId);

                // Configuring AWS SDK to connect to Identity pool
                AWS.config.update({ region: this.identityId.split(':')[0] });
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: this.identityId
                });

                var self = this;

                // LogIn
                AWS.config.credentials.get(function (err) {
                        if (err) { 
                                console.log("Error", err);
                                self.logs.logError("Can't connect to AWS with such pool ID");
                                if (self.scope && !self.scope.$$phase) {
                                        self.scope.$digest();
                                }
                                return;
                        }

                        console.log("Connected with identity Id: " + AWS.config.credentials.identityId) ;
                        
                        var iot = new AWS.Iot();

                        iot.describeEndpoint({}, function(err, endpoint) {
                                if (err) {
                                        console.log(err, err.stack); // an error occurred
                                        self.logs.logError("Can't connect to AWS IoT. Have you configured IAM Policies right?");
                                        if (self.scope && !self.scope.$$phase) {
                                                self.scope.$digest();
                                        }
                                }
                                
                                console.log("Endpoint: ", endpoint);           // successful response

                                self.endpoint = endpoint.endpointAddress;

                                var options = {
                                        protocol:       'wss',
                                        clientId:       Math.random().toString(36).substring(2, 7),
                                        endpoint:       endpoint.endpointAddress,
                                        accessKeyId:    AWS.config.credentials.accessKeyId,
                                        secretKey:      AWS.config.credentials.secretAccessKey,
                                        sessionToken:   AWS.config.credentials.sessionToken,
                                        region:         AWS.config.credentials.identityId.split(':')[0]
                                };

                                self.clients.addClient(options);
                        });

                });
        };

        AppController.prototype.removeClient = function (clientCtr) {
                this.clients.removeClient(clientCtr);
        };

        angular.module('awsiot.sample', []).controller('AppController', AppController);
})();