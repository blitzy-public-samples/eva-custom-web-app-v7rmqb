# Variables for AWS Infrastructure Configuration
# Addresses requirement: Infrastructure Parameterization
# Technical Specifications/2.5 Deployment Architecture

# VPC Configuration Variables
variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidrs" {
  description = "The CIDR blocks for the subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "enable_dns_support" {
  description = "Whether to enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Whether to enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to the VPC and its associated resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "estate-kit"
  }
}

# S3 Configuration Variables
variable "s3_bucket_name" {
  description = "The name of the S3 bucket for document storage"
  type        = string
}

variable "s3_bucket_versioning" {
  description = "Specifies whether versioning is enabled for the S3 bucket"
  type        = bool
  default     = true
}

variable "s3_bucket_encryption" {
  description = "The encryption algorithm used for server-side encryption of the S3 bucket"
  type        = string
  default     = "AES256"
}

# RDS Configuration Variables
variable "rds_instance_class" {
  description = "The instance class for the RDS database"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_engine" {
  description = "The database engine to use for the RDS instance (e.g., 'postgres', 'mysql')"
  type        = string
  default     = "postgres"
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
}

# ECR Configuration Variables
variable "ecr_repository_name" {
  description = "The name of the ECR repository for container images"
  type        = string
}

variable "ecr_image_tag_mutability" {
  description = "The tag mutability setting for the ECR repository (e.g., MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

# EKS Configuration Variables
variable "eks_cluster_name" {
  description = "The name of the EKS cluster"
  type        = string
  default     = "estate-kit-cluster"
}

variable "eks_node_group_size" {
  description = "The desired size of the EKS node group"
  type        = number
  default     = 2
}

variable "eks_node_instance_type" {
  description = "The instance type for the EKS worker nodes"
  type        = string
  default     = "t3.medium"
}

# Additional VPC Variables (referenced in imported files)
variable "public_subnet_cidrs" {
  description = "The CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

# Additional RDS Variables (referenced in imported files)
variable "rds_storage_encrypted" {
  description = "Whether to enable storage encryption for the RDS instance"
  type        = bool
  default     = true
}

variable "rds_multi_az" {
  description = "Whether to enable Multi-AZ deployment for the RDS instance"
  type        = bool
  default     = true
}

variable "rds_backup_retention_period" {
  description = "The number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_username" {
  description = "The master username for the RDS instance"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "The master password for the RDS instance"
  type        = string
  sensitive   = true
}

# Region Variable (referenced in imported files)
variable "aws_region" {
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}