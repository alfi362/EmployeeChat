import boto3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('UsersTable')
def lambda_handler(event, context):
    user_attributes = event['request']['userAttributes']
    employee_id = event['userName']
    email = user_attributes.get('email', '')
    try:
        table.put_item(
            Item={
                'employeeId': employee_id,
                'email': email,
                'createdAt': user_attributes.get('sub', '')
            }
        )
        print(f"User {employee_id} successfully added to UsersTable")
    except Exception as e:
        print(f"Error saving user to DB: {str(e)}")
    return event