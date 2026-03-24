import json
import boto3
import time
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
cognito = boto3.client('cognito-idp', region_name='ap-south-1')
def lambda_handler(event, context):
    print("Connecting")    
    try:
        connection_id = event['requestContext']['connectionId']
        queryparams = event.get('queryStringParameters') or {}
        channel = queryparams.get('channel') or 'engineering'
        token = queryparams.get('token')
        employee_id = queryparams.get('employeeId')
        if not token:
            print("No token provided")
            return {'statusCode': 401, 'body': 'Unauthorized: No Token'}    
        if not employee_id:
            print("No employeeId provided")
            return {'statusCode': 401, 'body': 'Unauthorized: No ID'}
        try:
            response = cognito.get_user(AccessToken=token)
            cognito_username = response.get('Username')
            user_attributes = {attr['Name']: attr['Value'] for attr in response.get('UserAttributes', [])}
            cognito_sub = user_attributes.get('sub')
            print(f"Cognito Username: {cognito_username}, Sub: {cognito_sub}, Requested ID: {employee_id}")
            if employee_id not in [cognito_username, cognito_sub]:
                print("SECURITY BLOCK: Token identity does not match requested employeeId!")
                return {'statusCode': 401, 'body': 'Identity mismatch'}
            print("Boto3 Token Validation Successful!")
        except cognito.exceptions.NotAuthorizedException as e:
            print(f"Cognito rejected token (Expired or Invalid): {str(e)}")
            return {'statusCode': 401, 'body': 'Invalid or Expired Token'}
        except Exception as e:
            print(f"Token validation failed: {str(e)}")
            return {'statusCode': 401, 'body': 'Validation Error'}
        ttl_seconds = int(time.time()) + (24 * 60 * 60)
        item = {
            'connectionId': {'S': connection_id},
            'employeeId': {'S': employee_id},
            'channel': {'S' : channel},
            'ttl': {'N': str(ttl_seconds)}
        }
        print(f"Saving to Connection Table: {json.dumps(item)}")
        dynamodb.put_item(TableName='ConnectionsTable', Item=item)       
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