const AWS = require('aws-sdk');
const async = require('async');

/**
 * [createRole create a role & a managed policy & associate the two]
 * @param  {[type]}   iam      [aws iam client]
 * @param  {[type]}   roleType [role type]
 * @param  {Function} callback [callback function]
 * @return {[type]}            [return info of the role]
 */
function createRole(iam, roleType, callback) {

  async.parallel([
    (next) => doCreateRole(iam, roleType, next),
    (next) => createPolicy(iam, roleType, next)
  ], (err, results) => {
    if (err) {
      return callback(err);
    }
    attachRolePolicy(iam, results, callback);
  });
}

/**
 * [doCreateRole description]
 * @param  {[type]}   iam      [aws iam client]
 * @param  {[type]}   roleType [role type]
 * @param  {Function} next     [callback function]
 * @return {[type]}            [return name of the created role]
 */
function doCreateRole(iam, roleType, next) {
  const roleTrustPolicyPath = `./policies/${roleType}-exec-role.json`;
  const roleName = `${roleType}_exec_role_${Math.random().toString(36).substring(3,8)}`;
  var policy =
  `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "",
        "Effect": "Allow",
        "Principal": {
          "Service": "iot.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }`;
  console.log(`Start creating role for ${roleType}...`);
  iam.createRole({
    AssumeRolePolicyDocument: policy,
    RoleName: roleName
  }, (err, data) => {
    if (err) {
      return next(err);
    }
    return next(null, roleName);
  });
}

/**
 * [createPolicy Create a managed policy]
 * @param  {[type]}   iam      [aws iam client]
 * @param  {[type]}   roleType [role type]
 * @param  {Function} next     [callback function]
 * @return {[type]}            [return arn of the created policy]
 */
function createPolicy(iam, roleType, next) {
  const accessPolicyPath = `./policies/${roleType}-access-policy.json`;
  const policy =
  `{
    "Version": "2012-10-17",
    "Statement": {
      "Effect": "Allow",
      "Action": "es:ESHttpPut",
      "Resource": [
        "arn:aws:es:*:*:*"
      ]
    }
  }`;
  console.log(`Start creating access policy for ${roleType}...`);
  iam.createPolicy({
    PolicyDocument: policy,
    PolicyName: `${roleType}_access_policy_${Math.random().toString(36).substring(3,8)}` // randomly generate a policy name
  }, (err, data) => {
    if (err) {
      return next(err);
    }
    console.log(`Access policy creation is done.\nPolicy Name: ${data.Policy.PolicyName}.\nPolicy Arn: ${data.Policy.Arn}`);
    return next(null, data.Policy.Arn);
  });
}

/**
 * [attachRolePolicy attach the managed policy to role]
 * @param  {[type]}   iam      [iam client]
 * @param  {[type]}   results  [array [role_name, policy_arn]]
 * @param  {Function} callback [callback function]
 * @return {[type]}            [return an object containing info of the role]
 */
function attachRolePolicy(iam, results, callback) {
  console.log('Start attaching the policy to the role...');
  iam.attachRolePolicy({
    PolicyArn: results[1], // policy arn
    RoleName: results[0] // role name
  }, (err, data) => {
    var interval = setInterval(() => {
      iam.getRole({
        RoleName: results[0]
      }, (err, data) => {
        if (err) {
          return callback(err);
        }
        if (data.Role.Arn) {
          clearInterval(interval);
          console.log(`Attached. Role creation is done.\nRole Name: ${data.Role.RoleName}.\nRole Arn: ${data.Role.Arn}`);
          return callback(null, data);
        }
      });
    }, 7000);
  });
}

module.exports = createRole;
