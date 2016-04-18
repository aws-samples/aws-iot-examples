import time
import os
import pandas as pd
import numpy as np
import argparse
import boto3
 
def emit_to_iot(datafile):
    '''
    takes data file and publishes to topic on aws IoT
 
    example usage:
    python emit_to_AWS_IoT.py  sim_pred_maint_emit.csv
    '''
 
    client = boto3.client("iot-data")
    #create pandas dataframe from csv file
    data = pd.read_csv(datafile)
    while len(data) > 1:
        grouped_df = data.groupby('part-no')
        list_of_groups = grouped_df.groups
        # randomly select a group from the list
        group = np.random.choice(list_of_groups.keys())
        # sort by number of cycles and select the first element
        line = grouped_df.get_group(group).sort_values(by='cycle').iloc[0, :]
        # add a timestamp to the line of data
        line['timestamp']=int(time.time()*1000)
        # remove the line of data from our data from so we don't send the same point twice
        data.drop(data[data['part-no']==group].sort_values(by='cycle').head(1).index, inplace=True)
        payload = line.to_json()
        response = client.publish(
            topic="pm/topic",
            qos=1,
            payload=payload)
        time.sleep(0.5)
 
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("datafile", help="file to send to AWS")
    args = parser.parse_args()
    emit_to_iot(args.datafile)