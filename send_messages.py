import json
import boto3
import time
dynamodb = boto3.client('dynamodb', region_name='ap-south-1')   
def lambda_handler(event, context):
    print("Sending")
    try:
        sender_connection_id = event['requestContext']['connectionId']
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        apigw_client = boto3.client('apigatewaymanagementapi', endpoint_url=f"https://{domain_name}/{stage}")
        body = json.loads(event.get('body', '{}'))
        payload = body.get('payload', {})
        channel_id = payload.get('channelId',) or 'general'
        content = payload.get('content', '')
        sender_name =payload.get('sender') or 'Anonymous'
        message_id = f"msg_{int(time.time() * 1000)}"
        dynamodb.put_item(             #add messages to DB
            TableName='MessagesTable',
            Item={
                'messageId': {'S': message_id},
                'channelId': {'S': channel_id},
                'content': {'S': content},
                'sender':{'S' : sender_name},
                'timestamp': {'N': str(int(time.time()))}
            }
        )
        print(f"Saved message {message_id} to {channel_id}")
        response = dynamodb.scan(TableName='ConnectionsTable')   #Read the active connections from the database
        active_connections = response.get('Items', [])
        
        outbound_message = json.dumps({
            "type": "chatMessage",
            "data": {
                "channelId": channel_id,
                "content": content,
                "sender": sender_name
            }
        })
        for item in active_connections:              # Send messages to the connected ones in the websocket
            target_connection_id = item['connectionId']['S']
            
            if target_connection_id != sender_connection_id:
                try:
                    apigw_client.post_to_connection(
                        ConnectionId=target_connection_id,
                        Data=outbound_message.encode('utf-8')
                    )
                except Exception as e:
                    print(f"{target_connection_id} is Offline")                  
        return {'statusCode': 200, 'body': 'Message sent.'}
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return {'statusCode': 500, 'body': 'Failed to send message.'}