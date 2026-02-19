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

variable "purview_account_name" {
  description = "Name of the Microsoft Purview account"
  type        = string
  default     = "cribnosh-purview"
}

variable "enable_purview_public_access" {
  description = "Enable public network access for Purview"
  type        = bool
  default     = true
}
