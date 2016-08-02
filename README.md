# aws-iot-examples
Examples using AWS IoT (Internet of Things)

* mqttSample: A reference implementation for connecting a web application to AWS IoT using MQTT-over-WebSockets
* truckSimulator: Sample code for simulating an Internet-connected truck sending location and performance metrics to AWS IoT or an AWS IoT Device Shadow
* predictionDataSimulator: Python script which simulates publishing prediction data for a sample integration between AWS IoT and Amazon Machine Learning
* deviceSimulator: Cloudformation template and Lambda function for publishing device data as a simulator to AWS IoT
* justInTimeRegistration: Sample Lambda function code that creates and attaches an IoT policy to the just-in-time registered certificate. It also activates the certificate. The Lambda function is attached as a rule engine action to the registration topic $aws/events/certificates/registered/<caCertificateID>

