import json
import boto3
import time
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
def lambda_handler(event, context):
    print("Connecting")    
    try:
        connection_id = event['requestContext']['connectionId']
        authorizer = event['requestContext'].get('authorizer', {})
        employee_id = authorizer.get('principalId', 'unknown_user')
        ttl_seconds = int(time.time()) + (24 * 60 * 60)
        item = {
            'connectionId': {'S': connection_id},
            'employeeId': {'S': employee_id},
            'ttl': {'N': str(ttl_seconds)}
        }
        
        print(f"Saving to Connection Tables: {json.dumps(item)}")
        dynamodb.put_item(TableName='ConnectionsTable', Item=item)       #write to teh db
        return {
            'statusCode': 200,
            'body': 'Connected.'
        }  
    except Exception as e:
        print(f"Connection failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': 'Error Connecting.'
        }