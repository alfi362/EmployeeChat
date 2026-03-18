import boto3
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def lambda_handler(event, context):
    print("trying to disconnect")
    
    try:
        connection_id = event['requestContext']['connectionId']
        
        print(f"removing connection: {connection_id}")
        return{
            'statuscode':200,
            'body':'disconnected'
        }
    except Exception as e:
        print(f"error cant disconnect:{str(e)}")
        return{
            'statuscode': 500,
            'body':'unable to disconnect'
        }