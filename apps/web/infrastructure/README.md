# CribNosh Web Infrastructure

This directory contains all infrastructure as code (IaC) for the CribNosh web application. This repository is the **single source of truth** for all infrastructure management.

## Overview

The infrastructure is managed using **Terraform** and deploys to **AWS**. The setup includes:

- **AWS App Runner** - Containerized application hosting
- **ECR** - Docker image repository
- **S3** - Application storage and Terraform state
- **CloudFront** - CDN for static assets
- **WAF** - Web Application Firewall
- **CloudWatch** - Logging and monitoring
- **Secrets Manager** - Secure secret storage
- **DynamoDB** - Terraform state locking

## Directory Structure

```
infrastructure/
├── terraform/           # Terraform configuration files
│   ├── main.tf         # Main infrastructure resources
│   ├── variables.tf    # Variable definitions
│   ├── backend.tf      # Remote state configuration
│   └── terraform.tfvars.example  # Example variables (copy to terraform.tfvars)
├── scripts/            # Infrastructure management scripts
├── .github/            # GitHub Actions workflows (in root)
└── README.md           # This file
```

## Prerequisites

1. **Terraform** >= 1.0
   ```bash
   brew install terraform
   # or
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform
   ```

2. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

3. **Cloudflare API Token** (for DNS management, optional)
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   ```

## Quick Start

### 1. Configure Variables

Copy the example variables file and fill in your values:

```bash
cd apps/web/infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Changes

```bash
terraform plan
```

### 4. Apply Infrastructure

```bash
terraform apply
```

## Environment Variables

Required environment variables for Terraform:

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: eu-west-2)
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (optional, for DNS)

## State Management

Terraform state is stored remotely in S3 with DynamoDB locking:

- **State Bucket**: `cribnosh-terraform-state-*`
- **Lock Table**: `cribnosh-terraform-state-lock`

This ensures:
- State is backed up and versioned
- Multiple team members can work safely
- State locking prevents concurrent modifications

## Deployment Workflows

### Manual Deployment

```bash
cd apps/web/infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Automated Deployment (GitHub Actions)

Infrastructure changes are automatically deployed via GitHub Actions when:
- Changes are pushed to `main` branch
- Pull requests are merged
- Manual workflow dispatch is triggered

See `.github/workflows/infrastructure.yml` for details.

## Infrastructure Components

### AWS App Runner

- **Service**: Containerized Next.js application
- **Auto-scaling**: 5-20 instances
- **Health Checks**: Configured for fast failure detection
- **Always-On**: Minimum 5 instances to prevent cold starts

### ECR Repository

- **Purpose**: Docker image storage
- **Lifecycle**: Keeps last 10 tagged images
- **Scanning**: Automatic vulnerability scanning enabled

### S3 Storage

- **Purpose**: Application file storage
- **Versioning**: Enabled
- **Encryption**: AES256 server-side encryption
- **Lifecycle**: Old versions deleted after 30 days

### CloudFront Distribution

- **Purpose**: CDN for static assets and API caching
- **Cache Behaviors**:
  - Static assets (`/_next/static/*`): 1 year cache
  - API routes (`/api/*`): No cache
  - Default: 1 hour cache

### WAF (Web Application Firewall)

- **Managed Rules**: Common, SQLi, Bad Inputs
- **Rate Limiting**: 2000 requests per IP
- **CloudWatch Metrics**: Enabled for monitoring

### CloudWatch

- **Log Groups**: 7-day retention
- **Alarms**: Health, timeout, error rate, cold start detection
- **SNS**: Email notifications for alerts

## Cost Management

- **Monthly Budget**: $50-200 (configurable)
- **Budget Alerts**: 80%, 100%, 120% thresholds
- **Cost Breakdown**:
  - App Runner: $25-40/month
  - ECR: $1-2/month
  - S3: $1-3/month
  - CloudWatch: $1-2/month
  - Secrets Manager: $4-5/month
  - **Total**: ~$30-50/month

## Security

- All secrets stored in AWS Secrets Manager
- S3 buckets with public access blocked
- WAF protection enabled
- CloudFront SSL/TLS termination
- IAM roles with least privilege

## Monitoring

- **Health Checks**: `/api/health/fast` endpoint
- **Alarms**: Health, timeout, error rate, cold starts
- **Logs**: CloudWatch Logs with 7-day retention
- **Metrics**: App Runner, CloudFront, WAF metrics

## Troubleshooting

### State Lock Issues

If Terraform is stuck with a state lock:

```bash
# Check for locks
aws dynamodb scan --table-name cribnosh-terraform-state-lock

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Deployment Failures

1. Check CloudWatch logs for App Runner service
2. Verify secrets in Secrets Manager
3. Check ECR image exists and is accessible
4. Verify IAM roles have correct permissions

### Cost Alerts

If you receive budget alerts:
1. Check CloudWatch metrics for unusual activity
2. Review App Runner instance count
3. Check S3 storage usage
4. Review CloudWatch log retention settings

## Best Practices

1. **Always run `terraform plan` before `apply`**
2. **Review changes in pull requests**
3. **Use workspaces for different environments** (dev, staging, prod)
4. **Never commit `terraform.tfvars`** (contains secrets)
5. **Keep Terraform version updated**
6. **Regularly review and update variable defaults**

## Support

For infrastructure issues:
1. Check CloudWatch logs
2. Review Terraform state
3. Check AWS service health
4. Review GitHub Actions workflow logs

## Related Documentation

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Infrastructure Deployment Guide](../docs/infrastructure-deployment.md)

