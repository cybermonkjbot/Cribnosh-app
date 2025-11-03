terraform {
  backend "s3" {
    bucket         = "cribnosh-terraform-state-baa64cc0"
    key            = "cribnosh/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "cribnosh-terraform-state-lock"
    encrypt        = true
  }
}
