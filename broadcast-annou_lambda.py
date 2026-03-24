import json
import boto3
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
WEBSOCKET_API_ENDPOINT = "https://xdqsbghjq4.execute-api.ap-south-1.amazonaws.com/dev"
apigw_client = boto3.client('apigatewaymanagementapi', endpoint_url=WEBSOCKET_API_ENDPOINT)
def lambda_handler(event, context):
    print("Received SNS Broadcast Event")
    try:
        sns_message = event['Records'][0]['Sns']['Message']
        print(f"Message to broadcast: {sns_message}")
        response = dynamodb.scan(TableName='ConnectionsTable')
        active_connections = response.get('Items', [])
        for item in active_connections:
            connection_id = item['connectionId']['S']
            try:
                apigw_client.post_to_connection(
                    ConnectionId=connection_id,
                    Data=sns_message.encode('utf-8')
                )
            except Exception as e:
                print(f"User {connection_id} is offline. Skipping.")
        return {'statusCode': 200, 'body': 'Broadcast successful!'}
    except Exception as e:
        print(f"Error broadcasting message: {str(e)}")
        return {'statusCode': 500, 'body': 'Broadcast failed.'}