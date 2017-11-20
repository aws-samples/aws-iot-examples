# Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
