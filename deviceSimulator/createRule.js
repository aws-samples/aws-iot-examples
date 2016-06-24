const AWS = require('aws-sdk');
const createRole = require('./createRole.js');
const async = require('async');

/**
 * [createRule Create a role for iot rule & create a rule and assume the role]
 * @param  {[aws]}   iot          [aws iot client]
 * @param  {[aws]}   iam          [aws iam client]
 * @param  {[object]}   params    [info of elasticsearch domain]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function createRule(iot, iam, params, topic, callback) {
  console.log('start create rule...');
  async.waterfall([
    (next) => createRole(iam, 'iot', next),
    (results, next) => doCreateRule(iot, results, params, topic, next),
    (ruleName, next) => getTopicRule(iot, ruleName, next)
  ], (err, data) => {
    if (err) {
      return callback(err);
    }
    return callback(null, data);
  });
}

/**
 * [doCreateRule create an iot rule]
 * @param  {[aws]}      iot     [aws iot client]
 * @param  {[string]}   roleArn [role arn]
 * @param  {[object]}   params  [info of elasticsearch domain]
 * @param  {Function}   next    [callback function]
 * @return {[string]}           [rule name]
 */
function doCreateRule(iot, results, params, topic, next) {
  console.log('Start creating Iot topic rule...');
  const ruleName = `simulator_iot_elasticsearch_rule_${Math.random().toString(36).substring(3, 8)}`;
  const config = {
    ruleName: ruleName,
    topicRulePayload: {
      actions: [
        {
          elasticsearch: {
            endpoint: `http://${params.endpoint}`,     // params.esEndpoint
            id: '${timestamp()}',
            index: params.index,        // params.index
            roleArn: results.Role.Arn,
            type: params.type      // params.mapping
          }
        }
      ],
      sql: `SELECT * FROM "${topic}"`,
      awsIotSqlVersion: 'beta',
      description: 'Iot rule for simulation',
      ruleDisabled: false
    }
  };

  iot.createTopicRule(config, (err, data) => {
    if (err) {
      return next(err);
    } else {
      console.log('Successfully create Iot topic rule');
      return next(null, ruleName);
    }
  });
}

/**
 * [getTopicRule get info of the created rule]
 * @param  {[aws]}      iot      [aws iot client]
 * @param  {[string]}   ruleName [rule name]
 * @param  {Function} next     [callback function]
 * @return {[type]}            [topic rule info]
 */
function getTopicRule(iot, ruleName, next) {
  iot.getTopicRule({
    ruleName: ruleName
  }, (err, data) => {
    if (err) {
      return next(err);
    }
    setTimeout(() => {
      return next(null, data);
    }, 3000);
  });
}

module.exports = createRule;
