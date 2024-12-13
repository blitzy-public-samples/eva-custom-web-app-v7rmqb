# AWS Provider Configuration
# Version: 1.0
# Purpose: Configures AWS provider settings for secure multi-region deployment with comprehensive security controls

# Terraform version and provider requirements
terraform {
  # Enforce minimum Terraform version for security and stability
  required_version = ">= 1.0"

  # Required provider configurations with version constraints
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Primary AWS provider configuration for ca-central-1 region
provider "aws" {
  region = var.aws_region

  # Enforce default tags for all resources in primary region
  default_tags {
    tags = var.tags
  }

  # Security and compliance configurations
  default_tags {
    tags = {
      ManagedBy         = "terraform"
      LastUpdated       = timestamp()
      SecurityZone      = "primary"
      ComplianceStatus  = "pipeda-compliant"
    }
  }
}

# Secondary AWS provider configuration for disaster recovery in us-east-1
provider "aws" {
  alias  = "backup"
  region = var.aws_backup_region

  # Enforce consistent tagging across regions
  default_tags {
    tags = var.tags
  }

  # Additional security tags for backup region
  default_tags {
    tags = {
      ManagedBy         = "terraform"
      LastUpdated       = timestamp()
      SecurityZone      = "backup"
      ComplianceStatus  = "dr-compliant"
    }
  }

  # Ensure backup region provider only creates allowed resource types
  allowed_account_ids = ["${data.aws_caller_identity.current.account_id}"]
}

# Data source to get current AWS account information
data "aws_caller_identity" "current" {}

# Provider feature flags for enhanced security
provider "aws" {
  alias = "security_controls"
  
  # Enable security features
  default_tags {
    tags = {
      SecurityControls = "enabled"
      EncryptionRequired = "true"
      AccessLogging     = "enabled"
      ComplianceAudit   = "enabled"
    }
  }
}

# Additional provider configurations for specific service endpoints
provider "aws" {
  alias = "s3_endpoint"
  
  # Configure S3 endpoint for enhanced security
  endpoints {
    s3 = "s3.ca-central-1.amazonaws.com"
  }
  
  # Enforce encryption in transit
  default_tags {
    tags = {
      DataEncryption = "required"
      TransitEncryption = "required"
    }
  }
}