# Terraform AWS Variables Configuration
# Version: 1.0
# Purpose: Defines global variables for AWS infrastructure deployment with security and compliance controls

# Project name variable for consistent resource naming
variable "project" {
  type        = string
  description = "Name of the project used for resource naming and identification across AWS services"
  default     = "estate-kit"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

# Environment variable with strict validation for security compliance
variable "environment" {
  type        = string
  description = "Deployment environment with strict validation for security and compliance requirements"
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development for security compliance."
  }
}

# Primary AWS region variable ensuring PIPEDA compliance
variable "aws_region" {
  type        = string
  description = "Primary AWS region for resource deployment, must be in Canada for PIPEDA compliance"
  default     = "ca-central-1"

  validation {
    condition     = var.aws_region == "ca-central-1"
    error_message = "Primary region must be ca-central-1 for PIPEDA compliance requirements."
  }
}

# Backup region variable for disaster recovery
variable "aws_backup_region" {
  type        = string
  description = "Secondary AWS region for disaster recovery and high availability requirements"
  default     = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2"], var.aws_backup_region)
    error_message = "Backup region must be a valid US region for disaster recovery compliance."
  }
}

# Global resource tags for compliance and management
variable "tags" {
  type        = map(string)
  description = "Common tags for resource tracking, cost allocation, and compliance requirements"
  default = {
    Project            = "estate-kit"
    ManagedBy         = "terraform"
    Owner             = "devops"
    Environment       = "production"
    SecurityCompliance = "pipeda"
    CostCenter        = "estate-planning"
    BackupPolicy      = "required"
  }

  validation {
    condition     = contains(keys(var.tags), "SecurityCompliance")
    error_message = "Tags must include SecurityCompliance key for compliance tracking."
  }

  validation {
    condition     = contains(keys(var.tags), "BackupPolicy")
    error_message = "Tags must include BackupPolicy key for disaster recovery requirements."
  }
}

# Local variables for derived values and complex computations
locals {
  # Resource naming convention
  resource_prefix = "${var.project}-${var.environment}"
  
  # Enhanced tags with computed values
  common_tags = merge(var.tags, {
    FullName     = local.resource_prefix
    CreatedDate  = timestamp()
    TerraformManaged = "true"
  })
  
  # Region-specific configurations
  is_production = var.environment == "production"
  backup_enabled = local.is_production # Only enable backup in production
  
  # Security configurations
  security_controls = {
    encryption_required = true
    backup_retention   = local.is_production ? 30 : 7
    multi_region       = local.is_production
  }
}