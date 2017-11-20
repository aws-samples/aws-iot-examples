import urllib2
import os
import json
import urllib2
import os

def lambda_handler(event, context):

    # Get HERE App ID and App Code from Lambda Environment Variables
    app_id = os.environ['app_id']
    app_code = os.environ['app_code']
    
    # Extract geo-coordinates from event object passed by AWS IoT Rule
    coordinates = (event['coord'])
    layerId = # Layer ID for uploaded region for geofence.

    # Create URL for Geo Fencing API call
    url = 'https://gfe.cit.api.here.com/2/search/proximity.json?layer_ids='+layerId+'&app_id='+app_id+'&app_code='+app_code+'&proximity='+coordinates+'&key_attribute=POSTCODE'
    req = urllib2.Request(url)
    here_response = urllib2.urlopen(req)

    # Return response as a JSON object for handling by the AWS IoT Rule caller
    return json.dumps(here_response)
