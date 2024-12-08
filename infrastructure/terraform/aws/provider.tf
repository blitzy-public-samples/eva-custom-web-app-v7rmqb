# AWS Provider Configuration
# Addresses requirement: AWS Provider Configuration
# Technical Specifications/2.5 Deployment Architecture
# AWS Provider version 4.0.0

# Configure the required providers
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
  }

  # Configure backend for storing Terraform state
  backend "s3" {
    bucket         = "estate-kit-terraform-state"
    key            = "terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "estate-kit-terraform-state-lock"
  }
}

# Configure the AWS Provider
provider "aws" {
  region                   = var.aws_region
  shared_credentials_file  = "~/.aws/credentials"
  profile                  = "estate-kit"

  # Default tags applied to all resources
  default_tags {
    tags = {
      Project     = "Estate Kit"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

# Data source for current AWS region
data "aws_region" "current" {}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Variable for AWS region
variable "region" {
  description = "The AWS region where resources will be provisioned."
  type        = string
  default     = "ca-central-1"
}