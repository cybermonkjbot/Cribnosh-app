# GitHub Secrets Setup Guide

This document lists all the secrets you need to configure in your GitHub repository for the workflows to function properly.

## Required Secrets

### AWS Credentials (Required for all workflows)

These are required for deploying to AWS infrastructure managed by Terraform.

1. **`AWS_ACCESS_KEY_ID`**
   - Description: AWS access key ID for programmatic access
   - Used by: All workflows (infrastructure, optimized-deploy, build-docker)
   - How to get:
     - Go to AWS Console → IAM → Users → Your user → Security credentials
     - Create access key (if you don't have one)
     - Copy the Access key ID

2. **`AWS_SECRET_ACCESS_KEY`**
   - Description: AWS secret access key (paired with the access key ID)
   - Used by: All workflows (infrastructure, optimized-deploy, build-docker)
   - How to get:
     - Same location as above
     - Copy the Secret access key (only shown once when created)
     - **Important**: Store this securely - you can't retrieve it later

### Optional Secrets

3. **`CLOUDFLARE_API_TOKEN`** (Optional)
   - Description: Cloudflare API token for DNS management via Terraform
   - Used by: Terraform infrastructure workflow (if you want to manage DNS automatically)
   - How to get:
     - Go to Cloudflare Dashboard → My Profile → API Tokens
     - Create a token with DNS edit permissions
     - Copy the token
   - Note: Only needed if you want Terraform to automatically manage DNS records

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (exactly as listed above)
6. Enter the secret value
7. Click **Add secret**

## Secret Usage by Workflow

### Infrastructure Workflow (`.github/workflows/infrastructure.yml`)
- `AWS_ACCESS_KEY_ID` ✅ Required
- `AWS_SECRET_ACCESS_KEY` ✅ Required
- `CLOUDFLARE_API_TOKEN` ⚠️ Optional (for DNS management)
- `GITHUB_TOKEN` ✅ Auto-provided by GitHub (no action needed)

### Optimized Deploy Workflow (`.github/workflows/optimized-deploy.yml`)
- `AWS_ACCESS_KEY_ID` ✅ Required
- `AWS_SECRET_ACCESS_KEY` ✅ Required

### Build Docker Workflow (`.github/workflows/build-docker.yml`)
- `AWS_ACCESS_KEY_ID` ✅ Required
- `AWS_SECRET_ACCESS_KEY` ✅ Required

## AWS IAM Permissions Required

The AWS credentials need the following permissions:

### For Infrastructure Management (Terraform)
- `apprunner:*` - Manage App Runner services
- `ecr:*` - Manage ECR repositories
- `s3:*` - Manage S3 buckets (for state and storage)
- `cloudfront:*` - Manage CloudFront distributions
- `wafv2:*` - Manage WAF rules
- `iam:*` - Manage IAM roles and policies
- `cloudwatch:*` - Manage CloudWatch logs and alarms
- `secretsmanager:*` - Manage secrets
- `acm:*` - Manage SSL certificates
- `dynamodb:*` - Manage DynamoDB (for state locking)
- `lambda:*` - Manage Lambda functions
- `events:*` - Manage EventBridge rules
- `sns:*` - Manage SNS topics
- `budgets:*` - Manage budgets
- `ec2:*` - Manage VPC, subnets, load balancers (if enabled)

### For Application Deployment
- `ecr:GetAuthorizationToken` - Login to ECR
- `ecr:BatchCheckLayerAvailability` - Check image layers
- `ecr:GetDownloadUrlForLayer` - Download image layers
- `ecr:BatchGetImage` - Get images
- `ecr:PutImage` - Push images
- `apprunner:StartDeployment` - Deploy to App Runner
- `apprunner:DescribeService` - Check service status
- `apprunner:ListServices` - List services

## Security Best Practices

1. **Use IAM Roles Instead of Access Keys** (Recommended)
   - Consider using OIDC (OpenID Connect) to authenticate GitHub Actions with AWS
   - This eliminates the need to store long-lived access keys
   - More secure and follows AWS best practices

2. **Rotate Secrets Regularly**
   - Rotate AWS access keys every 90 days
   - Update secrets in GitHub when rotated

3. **Use Least Privilege**
   - Only grant the minimum permissions needed
   - Create separate IAM users/roles for different workflows if possible

4. **Monitor Secret Usage**
   - Enable CloudTrail to monitor AWS API calls
   - Review GitHub Actions logs regularly

## Setting Up OIDC (Optional but Recommended)

Instead of using access keys, you can use OIDC for more secure authentication:

1. Create an IAM OIDC identity provider in AWS
2. Create an IAM role with necessary permissions
3. Update workflows to use `aws-actions/configure-aws-credentials@v4` with OIDC
4. No need to store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` secrets

Example workflow change:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/github-actions-role
    role-session-name: GitHubActions
    aws-region: eu-west-2
```

## Verification

After adding secrets, you can verify they're working by:

1. Running the infrastructure workflow manually (workflow_dispatch)
2. Checking the workflow logs for authentication errors
3. Verifying that Terraform can access AWS resources

## Troubleshooting

### "Access Denied" Errors
- Check that the AWS credentials have the correct permissions
- Verify the secret names match exactly (case-sensitive)
- Ensure the IAM user/role has the required permissions

### "Secret Not Found" Errors
- Verify the secret name matches exactly (including underscores)
- Check that you're adding secrets to the correct repository
- Ensure you're using the right scope (repository vs organization)

### Terraform Backend Errors
- The Terraform state backend (S3 bucket) must exist
- The IAM user needs `s3:*` and `dynamodb:*` permissions for the state bucket
- Verify the backend configuration in `apps/web/infrastructure/terraform/backend.tf`

