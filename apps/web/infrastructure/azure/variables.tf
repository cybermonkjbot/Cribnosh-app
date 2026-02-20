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

variable "vnet_cidr" {
  description = "CIDR block for the virtual network"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "container_registry" {
  description = "Azure Container Registry URL"
  type        = string
  default     = "" # Placeholder if not found
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

variable "vm_size" {
  description = "Size of the virtual machine for Coolify"
  type        = string
  default     = "Standard_DS2_v2"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  default     = "" # Will be passed via tfvars or ENV
}

variable "enable_load_balancer" {
  description = "Enable Azure Load Balancer"
  type        = bool
  default     = true
}
