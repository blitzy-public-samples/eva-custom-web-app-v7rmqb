# AWS ECR Variables Configuration
# Version: 1.0.0
# Purpose: Defines variables for AWS ECR repositories with security and compliance features

# Import project and environment variables from parent module
variable "project" {
  type        = string
  description = "Project name inherited from root module for consistent resource naming"
}

variable "environment" {
  type        = string
  description = "Environment name inherited from root module for security policy enforcement"
}

# ECR Repository Names with security-compliant naming convention
variable "repository_names" {
  type        = map(string)
  description = "Map of ECR repository names for Estate Kit application components with PIPEDA-compliant naming and access controls"
  default = {
    frontend             = "estate-kit-frontend"
    backend             = "estate-kit-backend"
    document-service    = "estate-kit-document-service"
    user-service       = "estate-kit-user-service"
    notification-service = "estate-kit-notification-service"
  }

  validation {
    condition = alltrue([
      for name in values(var.repository_names) :
      can(regex("^[a-z][a-z0-9-]*$", name))
    ])
    error_message = "Repository names must be lowercase, start with a letter, and contain only letters, numbers, and hyphens for security compliance."
  }

  validation {
    condition = alltrue([
      for name in values(var.repository_names) :
      length(name) >= 3 && length(name) <= 63
    ])
    error_message = "Repository names must be between 3 and 63 characters long per AWS ECR naming requirements."
  }
}

# Image retention policy for security audit compliance
variable "image_retention_count" {
  type        = number
  description = "Number of container images to retain in each repository for security audit and compliance requirements"
  default     = 30

  validation {
    condition     = var.image_retention_count >= 10
    error_message = "Image retention count must be at least 10 for security audit compliance and disaster recovery purposes."
  }

  validation {
    condition     = var.image_retention_count <= 100
    error_message = "Image retention count must not exceed 100 to maintain optimal repository performance and cost efficiency."
  }
}

# Security scanning configuration for vulnerability management
variable "enable_image_scanning" {
  type        = bool
  description = "Enable automatic vulnerability scanning for container images as required by security compliance standards"
  default     = true

  validation {
    condition     = var.environment == "production" ? var.enable_image_scanning == true : true
    error_message = "Image scanning must be enabled in production environment for PIPEDA security compliance requirements."
  }
}

# Immutability settings for production compliance
variable "enable_image_immutability" {
  type        = bool
  description = "Enable image tag immutability to prevent tag overwrites and ensure audit trail compliance"
  default     = true

  validation {
    condition     = var.environment == "production" ? var.enable_image_immutability == true : true
    error_message = "Image tag immutability must be enabled in production for security audit compliance."
  }
}

# Cross-region replication configuration
variable "enable_replication" {
  type        = bool
  description = "Enable cross-region replication for disaster recovery compliance in production"
  default     = false

  validation {
    condition     = var.environment != "production" ? var.enable_replication == false : true
    error_message = "Cross-region replication should only be enabled in production environment."
  }
}

# Repository encryption configuration
variable "encryption_configuration" {
  type = object({
    encryption_type = string
    kms_key        = string
  })
  description = "Encryption configuration for ECR repositories to meet PIPEDA compliance requirements"
  default = {
    encryption_type = "KMS"
    kms_key        = "alias/aws/ecr"
  }

  validation {
    condition     = contains(["KMS", "AES256"], var.encryption_configuration.encryption_type)
    error_message = "Encryption type must be either KMS or AES256 for security compliance."
  }
}

# Repository lifecycle policy configuration
variable "lifecycle_policy" {
  type        = string
  description = "JSON-formatted ECR lifecycle policy for automated image cleanup and retention"
  default     = null

  validation {
    condition     = var.lifecycle_policy == null ? true : can(jsondecode(var.lifecycle_policy))
    error_message = "Lifecycle policy must be a valid JSON document if provided."
  }
}