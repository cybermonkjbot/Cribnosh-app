variable "app_name" {
  description = "Application name"
  type        = string
  default     = "cribnosh"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "UK South"
}

variable "container_registry" {
  description = "Azure Container Registry URL"
  type        = string
}

variable "image_name" {
  description = "Docker image name"
  type        = string
  default     = "cribnosh-web"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}
