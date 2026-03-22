import json
import boto3
import time
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
cognito =boto3.client('cognito-idp',region_name='ap-south-1')
def lambda_handler(event, context):
    print("Connecting")    
    try:
        connection_id = event['requestContext']['connectionId']
        queryparams=event.get('queryStringParameters') or {}
        channel = queryparams.get('channel') or 'engineering'
        token=queryparams.get('token')
        employee_id = queryparams.get('employeeId')
        if not token :
            print(f"no token provided")
            return {'statusCode': 401,'body':'Unauthorised'}    
        if not employee_id:
            print(f"No employeeId provided")
            return {'statusCode': 401, 'body': 'Unauthorized'}
        try:
            response = cognito.get_user(AccessToken=token)
            print("token is valid for user:",response['Username'])
            if response['Username'] != employee_id:
                print("token do not match employeeid")
                return{'statusCode':401,'body':'unauthorized...!!!! identity missmatch'}
        except Exception as e:
            print(f"token validation Failed:{str(e)}")
            return {'StatusCode': 401,'body':'Invalid Token'}
        ttl_seconds = int(time.time()) + (24 * 60 * 60)
        item = {
            'connectionId': {'S': connection_id},
            'employeeId': {'S': employee_id},
            'channel': {'S' : channel},
            'ttl': {'N': str(ttl_seconds)}
        }
        
        print(f"Saving to Connection Tables: {json.dumps(item)}")
        dynamodb.put_item(TableName='ConnectionsTable', Item=item)       #write to the db
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