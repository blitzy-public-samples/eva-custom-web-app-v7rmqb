# Variables for AWS RDS Configuration
# Addresses requirement: Database Infrastructure Setup
# Technical Specifications/2.5 Deployment Architecture

variable "rds_instance_class" {
  description = "The instance class for the RDS database"
  type        = string
  default     = "db.t3.medium"

  validation {
    condition     = can(regex("^db\\.", var.rds_instance_class))
    error_message = "The RDS instance class must start with 'db.'"
  }
}

variable "rds_engine" {
  description = "The database engine to use for the RDS instance (e.g., 'postgres', 'mysql')"
  type        = string
  default     = "postgres"

  validation {
    condition     = contains(["postgres", "mysql", "aurora-postgresql", "aurora-mysql"], var.rds_engine)
    error_message = "The RDS engine must be one of: postgres, mysql, aurora-postgresql, aurora-mysql"
  }
}

variable "rds_engine_version" {
  description = "The version of the database engine"
  type        = string
  default     = "14.6"
}

variable "rds_allocated_storage" {
  description = "The amount of storage (in GB) to allocate for the RDS instance"
  type        = number
  default     = 20

  validation {
    condition     = var.rds_allocated_storage >= 20 && var.rds_allocated_storage <= 65536
    error_message = "RDS allocated storage must be between 20 GB and 65536 GB"
  }
}

variable "rds_backup_retention_period" {
  description = "The number of days to retain backups for the RDS instance"
  type        = number
  default     = 7

  validation {
    condition     = var.rds_backup_retention_period >= 0 && var.rds_backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days"
  }
}

variable "rds_multi_az" {
  description = "Whether to enable Multi-AZ deployment for the RDS instance"
  type        = bool
  default     = true
}

variable "rds_storage_encrypted" {
  description = "Whether to enable storage encryption for the RDS instance"
  type        = bool
  default     = true
}

variable "rds_tags" {
  description = "Tags to apply to the RDS instance and its associated resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "estate-kit-database"
  }
}

variable "subnet_ids" {
  description = "The IDs of the subnets to associate with the RDS instance"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least two subnet IDs are required for RDS deployment"
  }
}

variable "dynamodb_table_name" {
  description = "The name of the DynamoDB table for state locking"
  type        = string
}

variable "aws_region" {
  description = "The AWS region where the RDS instance will be created"
  type        = string
  default     = "us-west-2"
}

variable "db_username" {
  description = "The master username for the RDS instance"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username))
    error_message = "The database username must start with a letter and contain only alphanumeric characters and underscores"
  }
}

variable "db_password" {
  description = "The master password for the RDS instance"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "The database password must be at least 8 characters long"
  }
}