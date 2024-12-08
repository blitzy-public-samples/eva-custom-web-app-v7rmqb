# Backend configuration for Terraform state management
# Addresses requirement: State Management and Locking
# Technical Specifications/2.5 Deployment Architecture

# AWS Provider version 4.0.0
terraform {
  # Configure S3 backend for state storage with DynamoDB locking
  backend "s3" {
    # S3 bucket for storing Terraform state
    bucket = "${var.s3_bucket_name}"
    
    # Path to state file within bucket
    key = "terraform/state/estate-kit.tfstate"
    
    # AWS region for S3 bucket and DynamoDB table
    region = "ca-central-1"
    
    # Enable state encryption at rest
    encrypt = true
    
    # DynamoDB table for state locking
    dynamodb_table = "${var.dynamodb_table_name}"
    
    # Additional backend settings for enhanced security and reliability
    force_path_style = false
    skip_region_validation = false
    skip_credentials_validation = false
    skip_metadata_api_check = false
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
  }
}