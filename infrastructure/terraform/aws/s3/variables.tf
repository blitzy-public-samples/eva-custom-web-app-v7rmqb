# Variables for AWS S3 Configuration
# Addresses requirement: Infrastructure Parameterization
# Technical Specifications/2.5 Deployment Architecture
# Centralizes configuration parameters for AWS S3 resources to ensure consistency, scalability, and ease of management.

variable "s3_bucket_name" {
  description = "The name of the S3 bucket for document storage."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.s3_bucket_name))
    error_message = "S3 bucket name must be lowercase alphanumeric characters, dots, and hyphens, start and end with alphanumeric."
  }
}

variable "s3_bucket_versioning" {
  description = "Specifies whether versioning is enabled for the S3 bucket."
  type        = bool
  default     = true
}

variable "s3_bucket_encryption" {
  description = "The encryption algorithm used for server-side encryption of the S3 bucket."
  type        = string
  default     = "AES256"
  validation {
    condition     = contains(["AES256", "aws:kms"], var.s3_bucket_encryption)
    error_message = "Encryption algorithm must be either 'AES256' or 'aws:kms'."
  }
}

variable "s3_bucket_lifecycle_rules" {
  description = "Lifecycle rules for managing the S3 bucket's object versions."
  type = list(object({
    id      = string
    enabled = bool
    noncurrent_version_expiration = object({
      days = number
    })
  }))
  default = [
    {
      id      = "expire-old-versions"
      enabled = true
      noncurrent_version_expiration = {
        days = 30
      }
    }
  ]
  validation {
    condition     = length([for rule in var.s3_bucket_lifecycle_rules : rule if rule.noncurrent_version_expiration.days > 0]) == length(var.s3_bucket_lifecycle_rules)
    error_message = "Noncurrent version expiration days must be greater than 0."
  }
}

variable "tags" {
  description = "Tags to apply to the S3 bucket and its associated resources."
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "document-storage"
  }
}