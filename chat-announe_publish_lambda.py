import json
import boto3
sns = boto3.client('sns', region_name='ap-south-1')
SNS_TOPIC_ARN = 'arn:aws:sns:ap-south-1:767398007951:CompanyAnnouncements'
ALLOWED_ADMINS = ['admin', 'hr_manager', 'emp_001']
def lambda_handler(event, context):
    print("Received HR Announcement Request")
    try:
        body = json.loads(event.get('body', '{}'))
        announcement = body.get('announcement')
        priority = body.get('priority', 'normal')
        sender_id = body.get('sender_id')
        if sender_id not in ALLOWED_ADMINS:
            return {
                'statusCode': 403, 
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized. HR Admins only.'})
            }
        if not announcement:
            return {
                'statusCode': 400, 
                'body': json.dumps('Error: Announcement text is required.')
            }        
        message_payload = {
            "type": "hr_announcement",
            "announcement": announcement,
            "priority": priority
        }    
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(message_payload),
            Subject=f"Company Announcement: {priority.upper()}"
        )    
        print(f"Successfully published to SNS. Message ID: {response['MessageId']}")
        return {
            'statusCode': 200, 
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'message': 'Announcement published successfully!'})
        }        
    except Exception as e:
        print(f"Error publishing announcement: {str(e)}")
        return {
            'statusCode': 500, 
            'body': json.dumps({'error': 'Failed to publish announcement.'})
        }