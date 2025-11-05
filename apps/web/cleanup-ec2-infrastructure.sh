#!/bin/bash

set -e

echo "=========================================="
echo "CribNosh EC2 Infrastructure Cleanup"
echo "=========================================="

# Set AWS region
export AWS_REGION=${AWS_REGION:-eu-west-2}

echo "[INFO] Cleaning up orphaned EC2 infrastructure..."

# 1. Delete Auto Scaling Group (this will terminate instances)
echo "[INFO] Deleting Auto Scaling Group..."
ASG_NAME=$(aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[?contains(AutoScalingGroupName, 'cribnosh')].AutoScalingGroupName" --output text)
if [ -n "$ASG_NAME" ]; then
    echo "[INFO] Found ASG: $ASG_NAME"
    aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$ASG_NAME" --force-delete
    echo "[SUCCESS] Auto Scaling Group deleted"
else
    echo "[INFO] No Auto Scaling Group found"
fi

# 2. Delete Launch Template
echo "[INFO] Deleting Launch Template..."
LAUNCH_TEMPLATE_ID=$(aws ec2 describe-launch-templates --query "LaunchTemplates[?contains(LaunchTemplateName, 'cribnosh')].LaunchTemplateId" --output text)
if [ -n "$LAUNCH_TEMPLATE_ID" ]; then
    echo "[INFO] Found Launch Template: $LAUNCH_TEMPLATE_ID"
    aws ec2 delete-launch-template --launch-template-id "$LAUNCH_TEMPLATE_ID"
    echo "[SUCCESS] Launch Template deleted"
else
    echo "[INFO] No Launch Template found"
fi

# 3. Delete Load Balancer
echo "[INFO] Deleting Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, 'cribnosh')].LoadBalancerArn" --output text)
if [ -n "$ALB_ARN" ]; then
    echo "[INFO] Found ALB: $ALB_ARN"
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN"
    echo "[SUCCESS] Load Balancer deleted"
else
    echo "[INFO] No Load Balancer found"
fi

# 4. Delete Target Groups
echo "[INFO] Deleting Target Groups..."
TARGET_GROUP_ARNS=$(aws elbv2 describe-target-groups --query "TargetGroups[?contains(TargetGroupName, 'cribnosh')].TargetGroupArn" --output text)
if [ -n "$TARGET_GROUP_ARNS" ]; then
    for tg_arn in $TARGET_GROUP_ARNS; do
        echo "[INFO] Deleting Target Group: $tg_arn"
        aws elbv2 delete-target-group --target-group-arn "$tg_arn"
    done
    echo "[SUCCESS] Target Groups deleted"
else
    echo "[INFO] No Target Groups found"
fi

# 5. Delete Security Groups
echo "[INFO] Deleting Security Groups..."
SECURITY_GROUP_IDS=$(aws ec2 describe-security-groups --query "SecurityGroups[?contains(GroupName, 'cribnosh') && GroupName != 'default'].GroupId" --output text)
if [ -n "$SECURITY_GROUP_IDS" ]; then
    for sg_id in $SECURITY_GROUP_IDS; do
        echo "[INFO] Deleting Security Group: $sg_id"
        aws ec2 delete-security-group --group-id "$sg_id"
    done
    echo "[SUCCESS] Security Groups deleted"
else
    echo "[INFO] No Security Groups found"
fi

# 6. Delete IAM Roles and Policies
echo "[INFO] Deleting IAM Roles and Policies..."
ROLE_NAMES=$(aws iam list-roles --query "Roles[?contains(RoleName, 'cribnosh') && contains(RoleName, 'ec2')].RoleName" --output text)
if [ -n "$ROLE_NAMES" ]; then
    for role_name in $ROLE_NAMES; do
        echo "[INFO] Deleting IAM Role: $role_name"
        # Detach policies first
        aws iam list-attached-role-policies --role-name "$role_name" --query "AttachedPolicies[].PolicyArn" --output text | xargs -I {} aws iam detach-role-policy --role-name "$role_name" --policy-arn {} 2>/dev/null || true
        # Delete inline policies
        aws iam list-role-policies --role-name "$role_name" --query "PolicyNames[]" --output text | xargs -I {} aws iam delete-role-policy --role-name "$role_name" --policy-name {} 2>/dev/null || true
        # Delete the role
        aws iam delete-role --role-name "$role_name"
    done
    echo "[SUCCESS] IAM Roles deleted"
else
    echo "[INFO] No IAM Roles found"
fi

# 7. Delete CloudWatch Log Groups
echo "[INFO] Deleting CloudWatch Log Groups..."
LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/cribnosh" --query "logGroups[].logGroupName" --output text)
if [ -n "$LOG_GROUPS" ]; then
    for log_group in $LOG_GROUPS; do
        echo "[INFO] Deleting Log Group: $log_group"
        aws logs delete-log-group --log-group-name "$log_group"
    done
    echo "[SUCCESS] CloudWatch Log Groups deleted"
else
    echo "[INFO] No CloudWatch Log Groups found"
fi

# 8. Delete CloudWatch Alarms
echo "[INFO] Deleting CloudWatch Alarms..."
ALARM_NAMES=$(aws cloudwatch describe-alarms --query "MetricAlarms[?contains(AlarmName, 'cribnosh') && contains(AlarmName, 'ec2')].AlarmName" --output text)
if [ -n "$ALARM_NAMES" ]; then
    for alarm_name in $ALARM_NAMES; do
        echo "[INFO] Deleting Alarm: $alarm_name"
        aws cloudwatch delete-alarms --alarm-names "$alarm_name"
    done
    echo "[SUCCESS] CloudWatch Alarms deleted"
else
    echo "[INFO] No CloudWatch Alarms found"
fi

# 9. Delete WAF Web ACL (if exists)
echo "[INFO] Deleting WAF Web ACL..."
WAF_ACL_ID=$(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?contains(Name, 'cribnosh')].Id" --output text)
if [ -n "$WAF_ACL_ID" ]; then
    echo "[INFO] Found WAF ACL: $WAF_ACL_ID"
    aws wafv2 delete-web-acl --scope REGIONAL --id "$WAF_ACL_ID"
    echo "[SUCCESS] WAF Web ACL deleted"
else
    echo "[INFO] No WAF Web ACL found"
fi

# 10. Wait for instances to terminate
echo "[INFO] Waiting for instances to terminate..."
aws ec2 wait instance-terminated --filters "Name=tag:Application,Values=cribnosh" "Name=instance-state-name,Values=running" || echo "[INFO] No running instances found"

echo "=========================================="
echo "EC2 Infrastructure Cleanup Complete!"
echo "=========================================="
