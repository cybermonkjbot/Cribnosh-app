#!/bin/bash
# Terraform initialization script for CribNosh infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo "🔧 Initializing Terraform for CribNosh infrastructure..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    echo "   Visit: https://www.terraform.io/downloads"
    exit 1
fi

# Check if AWS credentials are configured
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found in environment variables"
    echo "   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "   Or run: aws configure"
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo "⚠️  terraform.tfvars not found. Creating from example..."
    if [ -f "$TERRAFORM_DIR/terraform.tfvars.example" ]; then
        cp "$TERRAFORM_DIR/terraform.tfvars.example" "$TERRAFORM_DIR/terraform.tfvars"
        echo "✅ Created terraform.tfvars from example"
        echo "   Please edit terraform.tfvars with your values before proceeding"
        exit 1
    else
        echo "❌ terraform.tfvars.example not found"
        exit 1
    fi
fi

# Navigate to terraform directory
cd "$TERRAFORM_DIR"

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

echo "✅ Terraform initialized successfully!"
echo ""
echo "Next steps:"
echo "  1. Review terraform.tfvars configuration"
echo "  2. Run: terraform plan"
echo "  3. Run: terraform apply"

