const elasticsearch = require('elasticsearch');

/**
 * [createESIndex create an index & mapping]
 * @param  {[type]}   params     [info of the created domain]
 * @param  {Function} next       [callback function]
 * @return {[type]}              [info of the created es domain with index & mapping added]
 */
function createESIndex(params, next) {

  console.log('Start creating index and mapping...');

  const typeName = `mapping_${Math.random().toString(36).substring(3,8)}`;
  const indexName = `index_${Math.random().toString(36).substring(3,8)}`;

  const client = new elasticsearch.Client({
    host: `http://${params.endpoint}`
  });

  client.indices.create({
    index: indexName
  }, (err, data) => {
    if (err) {
      return next(err);
    }
    var mapping = JSON.parse(
    `{
      "properties": {
        "field": {
          "type":"string"
        }
      }
    }`);

    client.indices.putMapping({
      index: indexName,
      type: typeName,
      body: mapping
    }, (err, date) => {
      if (err) {
        return next(err);
      }
      params.index = indexName;
      params.type = typeName;
      console.log(`Index & mapping creation is done. Index Name: ${indexName}. Mapping Name: ${typeName}`);
      return next(null, params);
    });
  });
}

module.exports = createESIndex;
