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
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  skip_provider_registration = true
}

resource "azurerm_resource_group" "app_rg" {
  name     = "${var.app_name}-${var.environment}-rg"
  location = var.location
}

resource "azurerm_container_registry" "acr" {
  name                = "cribnoshregistry"
  resource_group_name = azurerm_resource_group.app_rg.name
  location            = azurerm_resource_group.app_rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Networking
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.app_name}-${var.environment}-vnet-ukw"
  address_space       = [var.vnet_cidr]
  location            = "ukwest"
  resource_group_name = azurerm_resource_group.app_rg.name
}

resource "azurerm_subnet" "public" {
  name                 = "public-subnet-ukw"
  resource_group_name  = azurerm_resource_group.app_rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.public_subnet_cidr]
}

resource "azurerm_network_security_group" "nsg" {
  name                = "${var.app_name}-${var.environment}-nsg"
  location            = "ukwest"
  resource_group_name = azurerm_resource_group.app_rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Coolify"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "nsg_assoc" {
  subnet_id                 = azurerm_subnet.public.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.app_name}-${var.environment}-logs"
  location            = "ukwest"
  resource_group_name = azurerm_resource_group.app_rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Application Insights
resource "azurerm_application_insights" "app_insights" {
  name                = "${var.app_name}-${var.environment}-insights"
  location            = "ukwest"
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
  name                        = "${var.purview_account_name}-v4"
  resource_group_name         = azurerm_resource_group.app_rg.name
  location                    = "uksouth"
  
  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_container_app_environment" "app_env" {
  name                       = "${var.app_name}-${var.environment}-env"
  location                   = "ukwest"
  resource_group_name        = azurerm_resource_group.app_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

resource "azurerm_user_assigned_identity" "app_identity" {
  name                = "${var.app_name}-${var.environment}-identity"
  location            = azurerm_resource_group.app_rg.location
  resource_group_name = azurerm_resource_group.app_rg.name
}

resource "azurerm_container_app" "web_app" {
  name                         = "${var.app_name}-${var.environment}-web-v4"
  container_app_environment_id = azurerm_container_app_environment.app_env.id
  resource_group_name          = azurerm_resource_group.app_rg.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app_identity.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app_identity.id
  }

  template {
    min_replicas = 1
    max_replicas = 5

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

  depends_on = [time_sleep.wait_for_acr_permissions]

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

# Diagnostic Settings for Container App Environment
# This captures network and system-level events for the entire environment
resource "azurerm_monitor_diagnostic_setting" "env_diagnostics" {
  name                       = "${var.app_name}-env-diagnostics-ukw"
  target_resource_id         = azurerm_container_app_environment.app_env.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  enabled_log {
    category = "ContainerAppConsoleLogs"
    # Note: Transitioning to category_group = "allLogs" is often preferred in newer provider versions
  }

  enabled_log {
    category = "ContainerAppSystemLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}



resource "azurerm_storage_account" "app_storage" {
  name                     = "${replace(var.app_name, "-", "")}${substr(var.environment, 0, 3)}store"
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

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app_identity.principal_id
}

# Add a delay to allow ACR permissions to propagate
resource "time_sleep" "wait_for_acr_permissions" {
  create_duration = "30s"

  depends_on = [azurerm_role_assignment.acr_pull]
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

# Coolify VM
resource "azurerm_public_ip" "vm_pip" {
  name                = "${var.app_name}-coolify-pip"
  location            = "ukwest" # Must match VM location
  resource_group_name = azurerm_resource_group.app_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "vm_nic" {
  name                = "${var.app_name}-coolify-nic"
  location            = "ukwest" # Must match VM location
  resource_group_name = azurerm_resource_group.app_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm_pip.id
  }
}

resource "azurerm_linux_virtual_machine" "coolify_vm" {
  name                = "${var.app_name}-coolify"
  resource_group_name = azurerm_resource_group.app_rg.name
  location            = "ukwest" # Using ukwest because uksouth is out of B/D/F series stock
  size                = var.vm_size
  admin_username      = var.admin_username
  network_interface_ids = [
    azurerm_network_interface.vm_nic.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}

# Load Balancer
resource "azurerm_public_ip" "lb_pip" {
  count               = var.enable_load_balancer ? 1 : 0
  name                = "${var.app_name}-lb-pip"
  location            = "ukwest"
  resource_group_name = azurerm_resource_group.app_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "app_lb" {
  count               = var.enable_load_balancer ? 1 : 0
  name                = "${var.app_name}-lb"
  location            = "ukwest"
  resource_group_name = azurerm_resource_group.app_rg.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.lb_pip[0].id
  }
}

resource "azurerm_lb_backend_address_pool" "backend_pool" {
  count           = var.enable_load_balancer ? 1 : 0
  loadbalancer_id = azurerm_lb.app_lb[0].id
  name            = "BackEndAddressPool"
}

resource "azurerm_network_interface_backend_address_pool_association" "nic_assoc" {
  count                   = var.enable_load_balancer ? 1 : 0
  network_interface_id    = azurerm_network_interface.vm_nic.id
  ip_configuration_name   = "internal"
  backend_address_pool_id = azurerm_lb_backend_address_pool.backend_pool[0].id
}

resource "azurerm_lb_probe" "http_probe" {
  count           = var.enable_load_balancer ? 1 : 0
  loadbalancer_id = azurerm_lb.app_lb[0].id
  name            = "http-probe"
  port            = 80
}

resource "azurerm_lb_rule" "lb_rule_http" {
  count                          = var.enable_load_balancer ? 1 : 0
  loadbalancer_id                = azurerm_lb.app_lb[0].id
  name                           = "LBRule-HTTP"
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = "PublicIPAddress"
  backend_address_pool_ids        = [azurerm_lb_backend_address_pool.backend_pool[0].id]
  probe_id                       = azurerm_lb_probe.http_probe[0].id
}
