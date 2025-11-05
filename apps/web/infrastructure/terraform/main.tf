# Main Terraform Configuration for CribNosh AWS Deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "cloudflare" {
  # API token will be read from CLOUDFLARE_API_TOKEN environment variable
  # or from cloudflare.tfvars file
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  name_prefix = "${var.app_name}-${var.environment}"
  common_tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# S3 bucket for Terraform state (only create if it doesn't exist)
resource "aws_s3_bucket" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = "cribnosh-terraform-state-${random_id.bucket_suffix[0].hex}"

  tags = merge(local.common_tags, {
    Name    = "CribNosh Terraform State"
    Purpose = "terraform-state"
  })
}

# Random ID for bucket name uniqueness
resource "random_id" "bucket_suffix" {
  count       = var.create_state_backend ? 1 : 0
  byte_length = 4
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  count  = var.create_state_backend ? 1 : 0
  bucket = aws_s3_bucket.terraform_state[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  count        = var.create_state_backend ? 1 : 0
  name         = "cribnosh-terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name    = "CribNosh Terraform State Lock"
    Purpose = "terraform-state-lock"
  })
}

# Output the bucket name for use in backend configuration
output "terraform_state_bucket" {
  value       = var.create_state_backend ? aws_s3_bucket.terraform_state[0].bucket : null
  description = "S3 bucket name for Terraform state"
}

output "terraform_state_lock_table" {
  value       = var.create_state_backend ? aws_dynamodb_table.terraform_state_lock[0].name : null
  description = "DynamoDB table name for Terraform state locking"
}

# Random string for S3 bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = local.name_prefix
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# S3 Bucket for application storage
resource "aws_s3_bucket" "app_storage" {
  bucket = "${local.name_prefix}-storage-${random_string.bucket_suffix.result}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    filter {
      prefix = ""
    }
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_runner" {
  name              = "/aws/apprunner/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}

# CloudFront Distribution for CDN
resource "aws_cloudfront_distribution" "app_distribution" {
  origin {
    domain_name = replace(aws_apprunner_service.app.service_url, "https://", "")
    origin_id   = "AppRunner-${local.name_prefix}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${local.name_prefix}"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "AppRunner-${local.name_prefix}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Forwarded-Proto"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for API routes
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "AppRunner-${local.name_prefix}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Forwarded-Proto"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "AppRunner-${local.name_prefix}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

# AWS WAF Web ACL for Security
resource "aws_wafv2_web_acl" "app_waf" {
  name  = "${local.name_prefix}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}WAFMetric"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# Associate WAF with CloudFront
resource "aws_wafv2_web_acl_association" "app_waf_association" {
  resource_arn = aws_cloudfront_distribution.app_distribution.arn
  web_acl_arn  = aws_wafv2_web_acl.app_waf.arn
}

# IAM Role for App Runner Service (ECR Access)
resource "aws_iam_role" "app_runner_service_role" {
  name = "${local.name_prefix}-app-runner-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach AWS managed policy for ECR access
resource "aws_iam_role_policy_attachment" "app_runner_service_ecr_policy" {
  role       = aws_iam_role.app_runner_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# IAM Role for App Runner Instance
resource "aws_iam_role" "app_runner_instance_role" {
  name = "${local.name_prefix}-app-runner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for App Runner Instance
resource "aws_iam_policy" "app_runner_instance_policy" {
  name        = "${local.name_prefix}-app-runner-instance-policy"
  description = "Policy for App Runner instance to access AWS services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "app_runner_instance_policy" {
  role       = aws_iam_role.app_runner_instance_role.name
  policy_arn = aws_iam_policy.app_runner_instance_policy.arn
}

# AWS Secrets Manager Secrets
resource "aws_secretsmanager_secret" "resend_api_key" {
  name        = "${local.name_prefix}-resend-api-key"
  description = "Resend API key for email service"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${local.name_prefix}-jwt-secret"
  description = "JWT secret for authentication"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "notion_token" {
  name        = "${local.name_prefix}-notion-token"
  description = "Notion API token"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "notion_database_id" {
  name        = "${local.name_prefix}-notion-database-id"
  description = "Notion database ID"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "basehub_token" {
  name        = "${local.name_prefix}-basehub-token"
  description = "BaseHub CMS token"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "huggingface_api_key" {
  name        = "${local.name_prefix}-huggingface-api-key"
  description = "Hugging Face API key"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "minio_access_key" {
  name        = "${local.name_prefix}-minio-access-key"
  description = "MinIO access key"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "minio_secret_key" {
  name        = "${local.name_prefix}-minio-secret-key"
  description = "MinIO secret key"
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "convex_url" {
  name        = "${local.name_prefix}-convex-url"
  description = "Convex database URL"
  tags        = local.common_tags
}


# Auto-scaling Configuration with enhanced cold start prevention
resource "aws_apprunner_auto_scaling_configuration_version" "app" {
  auto_scaling_configuration_name = "${local.name_prefix}-autoscaling"
  
  # Keep more minimum instances running to prevent cold starts
  min_size = var.enable_always_on ? var.min_size : 5  # Increased to 5 instances minimum
  max_size = var.max_size
  
  # Reduced max concurrency to trigger scaling earlier and keep more instances warm
  max_concurrency = var.max_concurrency
  
  tags = merge(local.common_tags, {
    HighAvailability = "enabled"
    AlwaysOn = var.enable_always_on ? "true" : "false"
    ColdStartPrevention = "aggressive"
    MinInstances = var.min_size
    TargetCapacity = var.target_capacity
  })
}

# VPC for Load Balancer (if enabled)
resource "aws_vpc" "app_vpc" {
  count = var.enable_load_balancer ? 1 : 0
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "app_igw" {
  count = var.enable_load_balancer ? 1 : 0
  
  vpc_id = aws_vpc.app_vpc[0].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets across multiple AZs
resource "aws_subnet" "public_subnets" {
  count = var.enable_load_balancer ? length(var.availability_zones) : 0
  
  vpc_id                  = aws_vpc.app_vpc[0].id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Application Load Balancer
resource "aws_lb" "app_lb" {
  count = var.enable_load_balancer ? 1 : 0
  
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg[0].id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# Security Group for ALB
resource "aws_security_group" "alb_sg" {
  count = var.enable_load_balancer ? 1 : 0
  
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.app_vpc[0].id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# ALB Target Group for App Runner
resource "aws_lb_target_group" "app_tg" {
  count = var.enable_load_balancer ? 1 : 0
  
  name     = "${local.name_prefix}-tg"
  port     = 443
  protocol = "HTTPS"
  vpc_id   = aws_vpc.app_vpc[0].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTPS"
  }

  tags = local.common_tags
}

# ALB Listener
resource "aws_lb_listener" "app_listener" {
  count = var.enable_load_balancer ? 1 : 0
  
  load_balancer_arn = aws_lb.app_lb[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.app_cert[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg[0].arn
  }
}

# SSL Certificate for ALB
resource "aws_acm_certificate" "app_cert" {
  count = var.enable_load_balancer ? 1 : 0
  
  domain_name       = "cribnosh.co.uk"
  validation_method = "DNS"

  subject_alternative_names = [
    "www.cribnosh.co.uk",
    "cribnosh.com",
    "www.cribnosh.com"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

# App Runner Service
resource "aws_apprunner_service" "app" {
  service_name = local.name_prefix

  source_configuration {
    image_repository {
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV = "production"
          PORT     = "3000"
          # Disable custom cursor by default to prevent cursor issues
          NEXT_PUBLIC_USE_CUSTOM_POINTER = "false"
          DISABLE_TRY_IT = "true"
          # Set API URL to the App Runner service URL
          NEXT_PUBLIC_API_URL = "https://pmneka8tt7.eu-west-2.awsapprunner.com"
        }
        runtime_environment_secrets = {
          RESEND_API_KEY = "${aws_secretsmanager_secret.resend_api_key.arn}"
          JWT_SECRET = "${aws_secretsmanager_secret.jwt_secret.arn}"
          NOTION_TOKEN = "${aws_secretsmanager_secret.notion_token.arn}"
          NOTION_DATABASE_ID = "${aws_secretsmanager_secret.notion_database_id.arn}"
          BASEHUB_TOKEN = "${aws_secretsmanager_secret.basehub_token.arn}"
          HUGGINGFACE_API_KEY = "${aws_secretsmanager_secret.huggingface_api_key.arn}"
          MINIO_ACCESS_KEY = "${aws_secretsmanager_secret.minio_access_key.arn}"
          MINIO_SECRET_KEY = "${aws_secretsmanager_secret.minio_secret_key.arn}"
          CONVEX_URL = "${aws_secretsmanager_secret.convex_url.arn}"
        }
      }
      image_identifier      = "${aws_ecr_repository.app.repository_url}:latest"
      image_repository_type = "ECR"
    }
    auto_deployments_enabled = false
    
    # Authentication configuration for ECR access
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner_service_role.arn
    }
  }

  instance_configuration {
    cpu    = var.cpu
    memory = var.memory
    instance_role_arn = aws_iam_role.app_runner_instance_role.arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.app.arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/health/fast"  # Use fast health check endpoint
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  # Enhanced configuration for high availability
  tags = merge(local.common_tags, {
    HighAvailability = "enabled"
    AlwaysOn = "true"
    AutoRecovery = "enabled"
    MultiAZ = "true"
  })
}

# App Runner Custom Domain Configurations
# Note: Custom domain associations are disabled due to certificate validation issues
# Using Cloudflare SSL instead for HTTPS termination
# resource "aws_apprunner_custom_domain_association" "cribnosh_uk" {
#   domain_name = "cribnosh.co.uk"
#   service_arn = aws_apprunner_service.app.arn
#   depends_on = [aws_acm_certificate.cribnosh_uk]
# }

# resource "aws_apprunner_custom_domain_association" "cribnosh_com" {
#   domain_name = "cribnosh.com"
#   service_arn = aws_apprunner_service.app.arn
#   depends_on = [aws_acm_certificate.cribnosh_com]
# }

# SSL Certificates for custom domains
# Note: ACM certificates are disabled - using Cloudflare SSL instead
# resource "aws_acm_certificate" "cribnosh_uk" {
#   domain_name       = "cribnosh.co.uk"
#   subject_alternative_names = ["www.cribnosh.co.uk"]
#   validation_method = "DNS"
#   lifecycle {
#     create_before_destroy = true
#   }
#   tags = local.common_tags
# }

# resource "aws_acm_certificate" "cribnosh_com" {
#   domain_name       = "cribnosh.com"
#   subject_alternative_names = ["www.cribnosh.com"]
#   validation_method = "DNS"
#   lifecycle {
#     create_before_destroy = true
#   }
#   tags = local.common_tags
# }

# Data source for cribnosh.co.uk zone
# data "cloudflare_zones" "cribnosh_uk" {
#   filter {
#     name = "cribnosh.co.uk"
#   }
# }

# Data source for cribnosh.com zone
# data "cloudflare_zones" "cribnosh_com" {
#   filter {
#     name = "cribnosh.com"
#   }
# }

# DNS records for cribnosh.co.uk
# resource "cloudflare_record" "cribnosh_uk_root" {
#   zone_id         = data.cloudflare_zones.cribnosh_uk.zones[0].id
#   name            = "cribnosh.co.uk"
#   content         = "3.10.109.232"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

# resource "cloudflare_record" "cribnosh_uk_root_alt1" {
#   zone_id         = data.cloudflare_zones.cribnosh_uk.zones[0].id
#   name            = "cribnosh.co.uk"
#   content         = "18.135.94.108"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

# resource "cloudflare_record" "cribnosh_uk_root_alt2" {
#   zone_id         = data.cloudflare_zones.cribnosh_uk.zones[0].id
#   name            = "cribnosh.co.uk"
#   content         = "3.10.10.12"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

#         resource "cloudflare_record" "cribnosh_uk_www" {
#           zone_id         = data.cloudflare_zones.cribnosh_uk.zones[0].id
#           name            = "www"
#           content         = "cribnosh.co.uk"
#           type            = "CNAME"
#           proxied         = true  # Enable Cloudflare proxy for SSL
#           allow_overwrite = true   # Allow overwriting existing records
#         }

# DNS records for cribnosh.com
# resource "cloudflare_record" "cribnosh_com_root" {
#   zone_id         = data.cloudflare_zones.cribnosh_com.zones[0].id
#   name            = "cribnosh.com"
#   content         = "3.10.109.232"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

# resource "cloudflare_record" "cribnosh_com_root_alt1" {
#   zone_id         = data.cloudflare_zones.cribnosh_com.zones[0].id
#   name            = "cribnosh.com"
#   content         = "18.135.94.108"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

# resource "cloudflare_record" "cribnosh_com_root_alt2" {
#   zone_id         = data.cloudflare_zones.cribnosh_com.zones[0].id
#   name            = "cribnosh.com"
#   content         = "3.10.10.12"  # App Runner IP address
#   type            = "A"
#   proxied         = true  # Enable Cloudflare proxy for SSL
#   allow_overwrite = true   # Allow overwriting existing records
# }

#         resource "cloudflare_record" "cribnosh_com_www" {
#           zone_id         = data.cloudflare_zones.cribnosh_com.zones[0].id
#           name            = "www"
#           content         = "cribnosh.com"
#           type            = "CNAME"
#           proxied         = true  # Enable Cloudflare proxy for SSL
#           allow_overwrite = true   # Allow overwriting existing records
# }

# CloudWatch Alarms for High Availability
resource "aws_cloudwatch_metric_alarm" "app_runner_health" {
  alarm_name          = "${local.name_prefix}-health-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/AppRunner"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors App Runner health"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# CloudWatch Alarm for Request Timeout Detection
resource "aws_cloudwatch_metric_alarm" "app_runner_timeout" {
  alarm_name          = "${local.name_prefix}-timeout-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestLatency"
  namespace           = "AWS/AppRunner"
  period              = "60"
  statistic           = "Average"
  threshold           = "100"  # Alert if average response time > 100 seconds
  alarm_description   = "This metric monitors App Runner request timeouts"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# CloudWatch Alarm for High Error Rate (including timeouts)
resource "aws_cloudwatch_metric_alarm" "app_runner_high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "AWS/AppRunner"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"  # Alert if more than 5 errors in 5 minutes
  alarm_description   = "This metric monitors App Runner error rate including timeouts"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# CloudWatch Alarm for Cold Start Detection
resource "aws_cloudwatch_metric_alarm" "app_runner_cold_start" {
  alarm_name          = "${local.name_prefix}-cold-start-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ActiveInstances"
  namespace           = "AWS/AppRunner"
  period              = "300"
  statistic           = "Average"
  threshold           = "4"  # Alert if less than 4 active instances (below minimum of 5)
  alarm_description   = "This metric monitors for potential cold starts - alerting when instances drop below 4"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "app_alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "app_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.app_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Lambda function for auto-recovery
resource "aws_lambda_function" "app_recovery" {
  filename         = "app_recovery.zip"
  function_name    = "${local.name_prefix}-recovery"
  role            = aws_iam_role.lambda_recovery_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      SERVICE_ARN = aws_apprunner_service.app.arn
    }
  }

  tags = local.common_tags
}

# IAM Role for Lambda recovery function
resource "aws_iam_role" "lambda_recovery_role" {
  name = "${local.name_prefix}-lambda-recovery-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda recovery function
resource "aws_iam_role_policy" "lambda_recovery_policy" {
  name = "${local.name_prefix}-lambda-recovery-policy"
  role = aws_iam_role.lambda_recovery_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "apprunner:StartDeployment",
          "apprunner:DescribeService",
          "apprunner:ListOperations"
        ]
        Resource = aws_apprunner_service.app.arn
      }
    ]
  })
}

# CloudWatch Event Rule for auto-recovery
resource "aws_cloudwatch_event_rule" "app_recovery_rule" {
  name        = "${local.name_prefix}-recovery-rule"
  description = "Trigger auto-recovery when App Runner becomes unhealthy"

  event_pattern = jsonencode({
    source      = ["aws.apprunner"]
    detail-type = ["App Runner Service State Change"]
    detail = {
      state = ["RUNNING_FAILED", "CREATE_FAILED", "UPDATE_FAILED"]
    }
  })

  tags = local.common_tags
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "app_recovery_target" {
  rule      = aws_cloudwatch_event_rule.app_recovery_rule.name
  target_id = "AppRecoveryTarget"
  arn       = aws_lambda_function.app_recovery.arn
}

# Lambda Permission for CloudWatch Events
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app_recovery.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.app_recovery_rule.arn
}

# Lambda function for keep-alive (prevents instances from going cold)
resource "aws_lambda_function" "keep_alive" {
  filename         = "keep_alive.zip"
  function_name    = "${local.name_prefix}-keep-alive"
  role            = aws_iam_role.lambda_keep_alive_role.arn
  handler         = "keep-alive-lambda.handler"
  runtime         = "nodejs18.x"
  timeout         = 60

  environment {
    variables = {
      SERVICE_URL = aws_apprunner_service.app.service_url
      KEEP_ALIVE_INTERVAL = "5"
      KEEP_ALIVE_CONCURRENCY = "10"
    }
  }

  tags = local.common_tags
}

# IAM Role for Lambda keep-alive function
resource "aws_iam_role" "lambda_keep_alive_role" {
  name = "${local.name_prefix}-lambda-keep-alive-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda keep-alive function
resource "aws_iam_role_policy" "lambda_keep_alive_policy" {
  name = "${local.name_prefix}-lambda-keep-alive-policy"
  role = aws_iam_role.lambda_keep_alive_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# CloudWatch Event Rule for keep-alive (runs every 5 minutes)
resource "aws_cloudwatch_event_rule" "keep_alive_rule" {
  name                = "${local.name_prefix}-keep-alive-rule"
  description         = "Trigger keep-alive every 5 minutes to prevent cold starts"
  schedule_expression = "rate(5 minutes)"

  tags = local.common_tags
}

# CloudWatch Event Target for keep-alive
resource "aws_cloudwatch_event_target" "keep_alive_target" {
  rule      = aws_cloudwatch_event_rule.keep_alive_rule.name
  target_id = "KeepAliveTarget"
  arn       = aws_lambda_function.keep_alive.arn
}

# Lambda Permission for CloudWatch Events (keep-alive)
resource "aws_lambda_permission" "allow_cloudwatch_keep_alive" {
  statement_id  = "AllowExecutionFromCloudWatchKeepAlive"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.keep_alive.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.keep_alive_rule.arn
}

# CloudWatch Alarm for Scale-Down Events (monitor aggressive scaling)
resource "aws_cloudwatch_metric_alarm" "app_runner_scale_down" {
  alarm_name          = "${local.name_prefix}-scale-down-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ActiveInstances"
  namespace           = "AWS/AppRunner"
  period              = "60"
  statistic           = "Average"
  threshold           = "6"  # Alert if instances drop below 6 (close to minimum of 5)
  alarm_description   = "This metric monitors for aggressive scale-down events"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# CloudWatch Alarm for High CPU Usage (indicates need for more instances)
resource "aws_cloudwatch_metric_alarm" "app_runner_high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/AppRunner"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"  # Alert if CPU usage > 70%
  alarm_description   = "This metric monitors for high CPU usage indicating need for scaling"
  alarm_actions       = [aws_sns_topic.app_alerts.arn]

  dimensions = {
    ServiceName = aws_apprunner_service.app.service_name
  }

  tags = local.common_tags
}

# Outputs
output "app_runner_service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.app.service_url
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app_storage.bucket
}

# Cloudflare DNS Outputs
output "cribnosh_uk_url" {
  description = "Primary domain URL (cribnosh.co.uk)"
  value       = "https://cribnosh.co.uk"
}

output "cribnosh_com_url" {
  description = "Secondary domain URL (cribnosh.com)"
  value       = "https://cribnosh.com"
}

output "cloudflare_dns_status" {
  description = "Cloudflare DNS configuration status"
  value       = "Both domains configured with Cloudflare proxy enabled"
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.app_distribution.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.app_distribution.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.app_waf.arn
}

# AWS Budget Configuration
resource "aws_budgets_budget" "app_runner_budget" {
  name         = "${local.name_prefix}-budget"
  budget_type  = "COST"
  limit_amount = var.budget_amount
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  time_period_start = "2024-01-01_00:00"

  cost_filter {
    name = "Application"
    values = [var.app_name]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 120
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}