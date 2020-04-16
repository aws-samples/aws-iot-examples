# aws-iot-examples
Examples using AWS IoT (Internet of Things)

This repository is now deprecated and will not receive further updates. It was originally started in 2016 as a collection of samples for building with the brand new AWS IoT service. Most of the samples included have been made obsolete by more recent features or solutions. Sub-bullets of the projects below link to better projects, documentation, or solutions which would likely better serve your interests.

* mqttSample: A reference implementation for connecting a web application to AWS IoT using MQTT-over-WebSockets
  * The best practice for connecting to AWS IoT Core in a browser application is to use [AWS Amplify](https://aws.amazon.com/amplify/). Alternatively, check out the AWS IoT Device SDK for Javascript, which includes some [browser examples](https://github.com/aws/aws-iot-device-sdk-js/tree/master/examples/browser).
* truckSimulator: Sample code for simulating an Internet-connected truck sending location and performance metrics to AWS IoT or an AWS IoT Device Shadow
  * For standing up device simulators, see the [IoT Device Simulator](https://aws.amazon.com/solutions/iot-device-simulator/) solution.
* predictionDataSimulator: Python script which simulates publishing prediction data for a sample integration between AWS IoT and Amazon Machine Learning
  * This sample predates the launch of Amazon SageMaker. Check out [this sample project](https://github.com/aws-samples/amazon-sagemaker-aws-greengrass-custom-timeseries-forecasting) for getting started with predictive maintenance using AWS IoT and Amazon SageMaker features.
* deviceSimulator: CloudFormation template and Lambda function for publishing device data as a simulator to AWS IoT
  * For standing up device simulators, see the [IoT Device Simulator](https://aws.amazon.com/solutions/iot-device-simulator/) solution.
* justInTimeRegistration: Sample Lambda function code that creates and attaches an IoT policy to the just-in-time registered certificate. It also activates the certificate. The Lambda function is attached as a rule engine action to the registration topic $aws/events/certificates/registered/&lt;caCertificateID&gt;
  * This sample is still suitable for just-in-time registration but you may be interested in some [additional device provisioning features](https://docs.aws.amazon.com/iot/latest/developerguide/iot-provision.html) that have launched since this sample was created, such as just-in-time provisioning, bulk provisioning, and fleet provisioning.
* hereGeofencingRule: Sample Lambda function code that utilizes HERE geofencing capabilities. Add this as an in-line function call in your AWS IoT topic rule to build geofencing evaluation into your rule at run time.
  * The pattern expressed in this example is still sound for demonstrating how an IoT Core rule can integrate with a third-party API using an AWS Lambda function. The PDF documentation includes outdated screenshots of the AWS management console experience. At least one major version of the HERE API has been released since this sample was created. You may wish to review the latest [developer documentation](https://developer.here.com/documentation) first.
