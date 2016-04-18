#Prediction Data Simulator

## Introduction
Predictive maintenance is one of many appealing use cases for the Internet of Things (IoT). Using sensors to predict the health of a fleet of machines in the field can prevent down time without conducting unnecessary maintenance. Further, predictive maintenance allows for maintenance to be conducted at the most cost effective time. Allowing you to shift your operations from being reactive to proactive. Predictive maintenance has applications for the automotive, aerospace, health, and smart city industries, just to name a few. Using the AWS IoT platform and Amazon Machine Learning (AML) allows you to easily connect things to the cloud, and deploy machine learning in real time to leverage predictive maintenance, preventing failures in the field.

## How to Use
* Python script which simulates publishing prediction data for a sample integration between AWS IoT and Amazon Machine Learning
* Example usage: `python emit_to_AWS_IoT.py  sim_pred_maint_emit.csv`
* Data file links:
 * [Training data set](https://s3.amazonaws.com/iot-aml-predmaint-demo/sim_pred_maint_train.csv)
 * [Test data set](https://s3.amazonaws.com/iot-aml-predmaint-demo/sim_pred_maint_emit.csv)
