#!/bin/bash
# Terraform apply script for CribNosh infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo "🚀 Applying Terraform changes for CribNosh infrastructure..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found. Please create it first."
    exit 1
fi

# Navigate to terraform directory
cd "$TERRAFORM_DIR"

# Ensure Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform not initialized. Running init..."
    terraform init
fi

# Check if plan file exists
if [ -f "tfplan" ]; then
    echo "📋 Using existing plan file (tfplan)..."
    terraform apply tfplan
else
    echo "⚠️  No plan file found. Running plan first..."
    terraform plan -out=tfplan
    echo ""
    read -p "Do you want to apply these changes? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        terraform apply tfplan
    else
        echo "❌ Apply cancelled"
        exit 1
    fi
fi

echo "✅ Terraform apply completed successfully!"
echo ""
echo "Infrastructure outputs:"
terraform output

