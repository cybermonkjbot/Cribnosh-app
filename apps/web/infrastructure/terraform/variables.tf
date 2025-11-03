# Variables for CribNosh AWS Deployment

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "cribnosh"
}

variable "create_state_backend" {
  description = "Whether to create the Terraform state backend (S3 bucket and DynamoDB table)"
  type        = bool
  default     = false
}

variable "cpu" {
  description = "CPU configuration for App Runner (recommended: 2 vCPU for production with better performance)"
  type        = string
  default     = "2 vCPU"
}

variable "memory" {
  description = "Memory configuration for App Runner (recommended: 4 GB for production with better performance)"
  type        = string
  default     = "4 GB"
}

variable "min_size" {
  description = "Minimum number of instances (increased to 5 for better cold start prevention)"
  type        = number
  default     = 5
}

variable "max_size" {
  description = "Maximum number of instances for auto-scaling"
  type        = number
  default     = 20
}

variable "max_concurrency" {
  description = "Maximum concurrent requests per instance before scaling (reduced to 15 for better cold start prevention)"
  type        = number
  default     = 15
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds (reduced for faster failure detection)"
  type        = number
  default     = 3
}

variable "health_check_interval" {
  description = "Health check interval in seconds (increased for stability)"
  type        = number
  default     = 15
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks before marking healthy"
  type        = number
  default     = 2
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks before marking unhealthy"
  type        = number
  default     = 5
}

variable "scale_up_cooldown" {
  description = "Cooldown period in seconds before scaling up again (reduced for faster scaling)"
  type        = number
  default     = 60
}

variable "scale_down_cooldown" {
  description = "Cooldown period in seconds before scaling down (increased to prevent frequent scaling)"
  type        = number
  default     = 300
}

variable "target_capacity" {
  description = "Target capacity percentage to maintain (higher = more instances kept warm)"
  type        = number
  default     = 80
}

variable "availability_zones" {
  description = "List of availability zones for high availability"
  type        = list(string)
  default     = ["eu-west-2a", "eu-west-2b", "eu-west-2c"]
}

variable "enable_always_on" {
  description = "Enable always-on configuration with multiple instances"
  type        = bool
  default     = true
}

variable "enable_load_balancer" {
  description = "Enable Application Load Balancer for high availability"
  type        = bool
  default     = true
}

variable "budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 200.0
}

variable "alert_email" {
  description = "Email address for budget alerts"
  type        = string
  default     = "your-email@example.com"
}

variable "domain_name" {
  description = "Domain name for Cloudflare DNS management (optional)"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 200.0
}