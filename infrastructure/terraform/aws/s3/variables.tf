# S3 bucket name variable with strict naming validation
variable "bucket_name" {
  type        = string
  description = "Name of the S3 bucket for document storage"
  
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.bucket_name)) && length(var.bucket_name) >= 3 && length(var.bucket_name) <= 63
    error_message = "Bucket name must be between 3 and 63 characters, contain only lowercase letters, numbers, dots, and hyphens, and start/end with a letter or number"
  }
}

# Versioning configuration for document history and compliance
variable "versioning_enabled" {
  type        = bool
  description = "Enable versioning for document history tracking and compliance requirements"
  default     = true # Required for PIPEDA compliance and disaster recovery
}

# Server-side encryption configuration for document security
variable "encryption_configuration" {
  type = object({
    algorithm         = string
    kms_master_key_id = optional(string)
  })
  description = "Server-side encryption configuration for document security (AES-256 or KMS)"
  default = {
    algorithm         = "AES256" # Default to AES-256 encryption as per security requirements
    kms_master_key_id = null
  }

  validation {
    condition     = contains(["AES256", "aws:kms"], var.encryption_configuration.algorithm)
    error_message = "Encryption algorithm must be either AES256 or aws:kms"
  }
}

# Access logging configuration for audit compliance
variable "logging_configuration" {
  type = object({
    target_bucket = string
    target_prefix = string
  })
  description = "Access logging configuration for audit compliance and security monitoring"
  default = {
    target_bucket = "" # Must be set in tfvars
    target_prefix = "s3-access-logs/"
  }
}

# Lifecycle rules for document management and retention
variable "lifecycle_rules" {
  type = list(object({
    id        = string
    enabled   = bool
    prefix    = optional(string)
    tags      = optional(map(string))
    transition = list(object({
      days          = number
      storage_class = string
    }))
    expiration = optional(object({
      days = number
    }))
  }))
  description = "Lifecycle rules for document retention, transition, and expiration policies"

  validation {
    condition     = alltrue([for rule in var.lifecycle_rules : contains(["STANDARD_IA", "ONEZONE_IA", "GLACIER", "DEEP_ARCHIVE"], rule.transition[0].storage_class)])
    error_message = "Storage class must be one of: STANDARD_IA, ONEZONE_IA, GLACIER, DEEP_ARCHIVE"
  }
}

# Cross-region replication configuration for disaster recovery
variable "replication_configuration" {
  type = object({
    role_arn = string
    rules = list(object({
      id     = string
      status = string
      destination = object({
        bucket        = string
        storage_class = optional(string)
      })
    }))
  })
  description = "Cross-region replication configuration for disaster recovery (1 hour RTO, 24 hour RPO)"
  default     = null # Must be configured in production environment
}

# Resource tags including compliance and security requirements
variable "tags" {
  type        = map(string)
  description = "Resource tags for the S3 bucket including compliance and security tags"
  default = {
    ManagedBy          = "terraform"
    SecurityCompliance = "pipeda"
    DataClassification = "confidential"
    Encryption        = "required"
    BackupEnabled     = "true"
    DisasterRecovery  = "enabled"
  }

  validation {
    condition     = contains(keys(var.tags), "SecurityCompliance") && contains(keys(var.tags), "DataClassification")
    error_message = "Tags must include SecurityCompliance and DataClassification for compliance requirements"
  }
}