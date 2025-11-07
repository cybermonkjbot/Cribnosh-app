#!/bin/bash
# Terraform plan script for CribNosh infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo "📋 Planning Terraform changes for CribNosh infrastructure..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found. Please create it first."
    echo "   Copy terraform.tfvars.example to terraform.tfvars and fill in your values"
    exit 1
fi

# Navigate to terraform directory
cd "$TERRAFORM_DIR"

# Ensure Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform not initialized. Running init..."
    terraform init
fi

# Run terraform plan
echo "🔍 Running terraform plan..."
terraform plan -out=tfplan

echo "✅ Terraform plan completed successfully!"
echo ""
echo "To apply these changes, run:"
echo "  terraform apply tfplan"
echo ""
echo "Or use the apply script:"
echo "  ./scripts/terraform-apply.sh"

