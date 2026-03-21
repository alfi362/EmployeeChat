import boto3
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
def lambda_handler(event, context):
    print("trying to disconnect")
    try:
        connection_id = event['requestContext']['connectionId']
        
        print(f"removing connection: {connection_id}")
        dynamodb.delete_item(            #database deletion
            TableName='ConnectionsTable',
            Key={
                'connectionId': {'S': connection_id}
            }
        )
        return{
            'statusCode':200,
            'body':'disconnected'
        }
    except Exception as e:
        print(f"error cant disconnect:{str(e)}")
        return{
            'statusCode': 500,
            'body':'unable to disconnect'
        }