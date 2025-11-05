import json
import boto3
import logging
import os
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
apprunner = boto3.client('apprunner')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Lambda function to automatically recover App Runner service when it becomes unhealthy
    """
    logger.info(f"Auto-recovery triggered: {json.dumps(event)}")
    
    service_arn = os.environ.get('SERVICE_ARN')
    if not service_arn:
        logger.error("SERVICE_ARN environment variable not set")
        return {
            'statusCode': 500,
            'body': json.dumps('SERVICE_ARN not configured')
        }
    
    try:
        # Get current service status
        response = apprunner.describe_service(ServiceArn=service_arn)
        service_status = response['Service']['Status']
        service_name = response['Service']['ServiceName']
        
        logger.info(f"Service {service_name} current status: {service_status}")
        
        # Check if service is in a failed state
        if service_status in ['CREATE_FAILED', 'UPDATE_FAILED', 'RUNNING_FAILED']:
            logger.warning(f"Service {service_name} is in failed state: {service_status}")
            
            # Attempt to restart the service by triggering a new deployment
            logger.info("Attempting to restart service...")
            
            try:
                # Start a new deployment
                deployment_response = apprunner.start_deployment(ServiceArn=service_arn)
                operation_id = deployment_response['OperationId']
                
                logger.info(f"Started new deployment with operation ID: {operation_id}")
                
                # Wait for deployment to complete (with timeout)
                max_wait_time = 300  # 5 minutes
                wait_interval = 30   # 30 seconds
                elapsed_time = 0
                
                while elapsed_time < max_wait_time:
                    operation = apprunner.describe_operation(OperationId=operation_id)
                    operation_status = operation['Operation']['Status']
                    
                    logger.info(f"Deployment status: {operation_status}")
                    
                    if operation_status == 'SUCCEEDED':
                        logger.info("Service recovery successful!")
                        
                        # Send success notification
                        send_notification(
                            f"✅ App Runner service {service_name} recovered successfully",
                            f"Service was automatically recovered from {service_status} state"
                        )
                        
                        return {
                            'statusCode': 200,
                            'body': json.dumps({
                                'message': 'Service recovered successfully',
                                'operationId': operation_id,
                                'status': operation_status
                            })
                        }
                    elif operation_status == 'FAILED':
                        logger.error(f"Deployment failed: {operation.get('Operation', {}).get('Error', 'Unknown error')}")
                        break
                    
                    time.sleep(wait_interval)
                    elapsed_time += wait_interval
                
                if elapsed_time >= max_wait_time:
                    logger.error("Deployment timeout - service may still be recovering")
                    
                    # Send warning notification
                    send_notification(
                        f"⚠️ App Runner service {service_name} recovery in progress",
                        f"Service recovery started but may take longer than expected"
                    )
                    
                    return {
                        'statusCode': 202,
                        'body': json.dumps({
                            'message': 'Recovery in progress',
                            'operationId': operation_id
                        })
                    }
                
            except Exception as e:
                logger.error(f"Failed to start deployment: {str(e)}")
                
                # Send failure notification
                send_notification(
                    f"❌ App Runner service {service_name} recovery failed",
                    f"Failed to start recovery deployment: {str(e)}"
                )
                
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': 'Failed to start recovery',
                        'details': str(e)
                    })
                }
        
        else:
            logger.info(f"Service {service_name} is in healthy state: {service_status}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Service is healthy',
                    'status': service_status
                })
            }
    
    except Exception as e:
        logger.error(f"Error during auto-recovery: {str(e)}")
        
        # Send error notification
        send_notification(
            f"❌ App Runner auto-recovery error",
            f"Error during auto-recovery process: {str(e)}"
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Auto-recovery failed',
                'details': str(e)
            })
        }

def send_notification(subject, message):
    """
    Send notification via SNS (if configured)
    """
    try:
        # This would integrate with your SNS topic
        # For now, just log the notification
        logger.info(f"NOTIFICATION - {subject}: {message}")
        
        # In production, you would send this to SNS:
        # sns = boto3.client('sns')
        # sns.publish(
        #     TopicArn='your-sns-topic-arn',
        #     Subject=subject,
        #     Message=message
        # )
        
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")

def put_metric(metric_name, value, unit='Count'):
    """
    Put custom metric to CloudWatch
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='CribNosh/AutoRecovery',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to put metric: {str(e)}")
