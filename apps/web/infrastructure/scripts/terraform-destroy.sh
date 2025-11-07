#!/bin/bash
# Terraform destroy script for CribNosh infrastructure
# WARNING: This will destroy all infrastructure resources!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo "⚠️  WARNING: This will DESTROY all infrastructure resources!"
echo "   This action cannot be undone!"
echo ""
read -p "Are you absolutely sure you want to destroy all infrastructure? Type 'destroy' to confirm: " -r
echo

if [[ ! $REPLY == "destroy" ]]; then
    echo "❌ Destroy cancelled"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Navigate to terraform directory
cd "$TERRAFORM_DIR"

# Ensure Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform not initialized. Running init..."
    terraform init
fi

# Run terraform destroy
echo "🗑️  Destroying infrastructure..."
terraform destroy

echo "✅ Infrastructure destroyed successfully!"

