# Estate Kit Terraform Backend Configuration
# Version: 1.0.0
# Purpose: Defines secure state storage and locking mechanism for Terraform state
# Compliance: PIPEDA-compliant with enhanced encryption and security controls

terraform {
  # Terraform version constraint for stability and security
  required_version = "~> 1.0"

  # S3 backend configuration with enhanced security and compliance features
  backend "s3" {
    # PIPEDA-compliant state storage configuration
    bucket = "${var.project}-${var.environment}-tfstate"
    key    = "terraform.tfstate"
    region = "ca-central-1"  # Canadian region for data sovereignty

    # Enhanced encryption configuration
    encrypt        = true
    kms_key_id     = "alias/terraform-state"
    
    # State locking configuration using DynamoDB
    dynamodb_table = "${var.project}-${var.environment}-tfstate-lock"

    # Access control and security settings
    acl                  = "private"
    force_path_style     = false
    verify_ssl          = true

    # Enhanced server-side encryption configuration
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm     = "aws:kms"
          kms_master_key_id = "alias/terraform-state"
        }
        bucket_key_enabled = true
      }
    }

    # Versioning configuration for state history
    versioning {
      enabled = true
      mfa_delete = true  # Requires MFA for state deletion
    }

    # Block public access settings
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true

    # Additional security controls
    lifecycle_rule {
      enabled = true
      noncurrent_version_expiration {
        days = 90  # Retain old state versions for 90 days
      }
    }

    # Tags for resource tracking and compliance
    tags = {
      Project            = var.project
      Environment       = var.environment
      ManagedBy        = "terraform"
      SecurityCompliance = "pipeda"
      Encryption       = "aws:kms"
      DataClassification = "sensitive"
    }
  }
}

# Local values for backend configuration
locals {
  backend_config = {
    state_bucket_name = "${var.project}-${var.environment}-tfstate"
    lock_table_name  = "${var.project}-${var.environment}-tfstate-lock"
    kms_key_alias    = "alias/terraform-state"
    region           = "ca-central-1"
  }
}

# Backend validation checks
check "backend_compliance" {
  assert {
    condition     = var.aws_region == "ca-central-1"
    error_message = "Backend must be configured in ca-central-1 for PIPEDA compliance."
  }

  assert {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be valid for proper state isolation."
  }
}