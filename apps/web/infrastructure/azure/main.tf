# Azure Infrastructure for CribNosh
# This is a draft configuration for migrating from AWS to Azure.

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "app_rg" {
  name     = "${var.app_name}-${var.environment}-rg"
  location = var.location
}

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.app_name}-${var.environment}-logs"
  location            = azurerm_resource_group.app_rg.location
  resource_group_name = azurerm_resource_group.app_rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Application Insights
resource "azurerm_application_insights" "app_insights" {
  name                = "${var.app_name}-${var.environment}-insights"
  location            = azurerm_resource_group.app_rg.location
  resource_group_name = azurerm_resource_group.app_rg.name
  workspace_id        = azurerm_log_analytics_workspace.logs.id
  application_type    = "web"
}

# Microsoft Sentinel (Onboarding to Log Analytics Workspace)
resource "azurerm_sentinel_log_analytics_workspace_onboarding" "sentinel" {
  workspace_id = azurerm_log_analytics_workspace.logs.id
}

# Microsoft Defender for Cloud (Standard Tier for Subscription)
resource "azurerm_security_center_subscription_pricing" "defender_default" {
  tier          = "Standard"
  resource_type = "VirtualMachines" # Example: Enable for VMs first
}

resource "azurerm_security_center_subscription_pricing" "defender_app_services" {
  tier          = "Standard"
  resource_type = "AppServices"
}

resource "azurerm_security_center_subscription_pricing" "defender_sql" {
  tier          = "Standard"
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "defender_keyvaults" {
  tier          = "Standard"
  resource_type = "KeyVaults"
}

resource "azurerm_security_center_subscription_pricing" "defender_arm" {
  tier          = "Standard"
  resource_type = "Arm"
}

resource "azurerm_security_center_subscription_pricing" "defender_containers" {
  tier          = "Standard"
  resource_type = "Containers"
}

resource "azurerm_security_center_subscription_pricing" "defender_registry" {
  tier          = "Standard"
  resource_type = "ContainerRegistry"
}


# Microsoft Purview Account
resource "azurerm_purview_account" "governance" {
  name                        = var.purview_account_name
  resource_group_name         = azurerm_resource_group.app_rg.name
  location                    = azurerm_resource_group.app_rg.location
  sku_name                    = "Standard_4" # Minimum capacity
  public_network_access_enabled = var.enable_purview_public_access
  
  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_container_app_environment" "app_env" {
  name                       = "${var.app_name}-${var.environment}-env"
  location                   = azurerm_resource_group.app_rg.location
  resource_group_name        = azurerm_resource_group.app_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

resource "azurerm_user_assigned_identity" "app_identity" {
  name                = "${var.app_name}-${var.environment}-identity"
  location            = azurerm_resource_group.app_rg.location
  resource_group_name = azurerm_resource_group.app_rg.name
}

resource "azurerm_container_app" "web_app" {
  name                         = "${var.app_name}-${var.environment}-web"
  container_app_environment_id = azurerm_container_app_environment.app_env.id
  resource_group_name          = azurerm_resource_group.app_rg.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app_identity.id]
  }

  template {
    container {
      name   = "web"
      image  = "${var.container_registry}/${var.image_name}:${var.image_tag}"
      cpu    = 1.0
      memory = "2Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "CLOUD_PROVIDER"
        value = "azure"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.app_insights.connection_string
      }
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# Diagnostic Settings for Container App
resource "azurerm_monitor_diagnostic_setting" "app_diagnostics" {
  name                       = "${var.app_name}-app-diagnostics"
  target_resource_id         = azurerm_container_app.web_app.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  # Container Apps usually have specific log categories like "ContainerAppConsoleLogs", "ContainerAppSystemLogs"
  # But Terraform provider validation for `log` block categories can be tricky without exact names.
  # For now, we will enable all logs if possible, or list specific ones known.
  # Checking documentation, valid categories usually are: "ContainerAppConsoleLogs", "ContainerAppSystemLogs"

  enabled_log {
    category = "ContainerAppConsoleLogs"

    retention_policy {
      enabled = false
      days    = 0
    }
  }

  enabled_log {
    category = "ContainerAppSystemLogs"

    retention_policy {
      enabled = false
      days    = 0
    }
  }

  metric {
    category = "AllMetrics"
    enabled  = true

    retention_policy {
      enabled = false
      days    = 0
    }
  }
}

resource "azurerm_storage_account" "app_storage" {
  name                     = "${replace(var.app_name, "-", "")}${var.environment}storage"
  resource_group_name      = azurerm_resource_group.app_rg.name
  location                 = azurerm_resource_group.app_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_role_assignment" "storage_blob_contributor" {
  scope                = azurerm_storage_account.app_storage.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.app_identity.principal_id
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.app_storage.name
  container_access_type = "private"
}

# Azure Front Door (CDN) - Draft configuration
resource "azurerm_cdn_frontdoor_profile" "fd" {
  name                = "${var.app_name}-fd"
  resource_group_name = azurerm_resource_group.app_rg.name
  sku_name            = "Standard_AzureFrontDoor"
}
