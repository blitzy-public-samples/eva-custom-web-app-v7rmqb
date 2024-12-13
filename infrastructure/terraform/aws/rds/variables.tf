# RDS Variables Configuration for Estate Kit Platform
# Version: 1.0.0
# Purpose: Defines variables for AWS RDS PostgreSQL instance deployment with security, 
# high availability, and compliance requirements for estate planning data

# Import project-level variables
variable "project" {
  type        = string
  description = "Project name for resource naming"
}

variable "environment" {
  type        = string
  description = "Deployment environment (production, staging, development)"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

# Instance Configuration
variable "db_instance_class" {
  type        = string
  description = "RDS instance class for the database"
  default     = "db.t3.large"
  validation {
    condition     = can(regex("^db\\.(t3|r5|m5)\\.(large|xlarge|2xlarge)$", var.db_instance_class))
    error_message = "Instance class must be db.t3/r5/m5.(large|xlarge|2xlarge)"
  }
}

# Database Configuration
variable "db_name" {
  type        = string
  description = "Name of the database to create"
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{1,63}$", var.db_name))
    error_message = "Database name must be 1-63 characters, start with a letter, and contain only alphanumeric characters or underscores"
  }
}

variable "db_username" {
  type        = string
  description = "Username for the database administrator"
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{4,31}$", var.db_username))
    error_message = "Username must be 5-32 characters, start with a letter, and contain only alphanumeric characters or underscores"
  }
}

variable "db_password" {
  type        = string
  description = "Password for the database administrator"
  sensitive   = true
  validation {
    condition     = can(regex("^[A-Za-z0-9\\!@#$%^&*()_+=-]{16,}$", var.db_password))
    error_message = "Password must be at least 16 characters and contain a mix of letters, numbers, and special characters"
  }
}

# High Availability Configuration
variable "multi_az" {
  type        = bool
  description = "Enable Multi-AZ deployment for high availability"
  default     = true
}

# Backup and Recovery Configuration
variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain automated backups"
  default     = 7
  validation {
    condition     = var.backup_retention_period >= 7
    error_message = "Backup retention period must be at least 7 days for compliance"
  }
}

# Security Configuration
variable "storage_encrypted" {
  type        = bool
  description = "Enable storage encryption at rest using AWS KMS"
  default     = true
}

# Engine Configuration
variable "engine_version" {
  type        = string
  description = "Version of PostgreSQL engine to use"
  default     = "14.7"
  validation {
    condition     = can(regex("^14\\.[0-9]+$", var.engine_version))
    error_message = "Engine version must be PostgreSQL 14.x"
  }
}

# Storage Configuration
variable "allocated_storage" {
  type        = number
  description = "Allocated storage size in gigabytes"
  default     = 100
  validation {
    condition     = var.allocated_storage >= 100
    error_message = "Allocated storage must be at least 100GB for production workload"
  }
}

# Network Configuration
variable "database_subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs where RDS can be provisioned"
  validation {
    condition     = length(var.database_subnet_ids) >= 2
    error_message = "At least two subnet IDs are required for high availability"
  }
}

variable "vpc_security_group_ids" {
  type        = list(string)
  description = "List of VPC security group IDs for RDS instance"
  validation {
    condition     = length(var.vpc_security_group_ids) >= 1
    error_message = "At least one security group ID is required"
  }
}