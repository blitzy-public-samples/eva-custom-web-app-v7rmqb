# Estate Kit RDS Infrastructure Configuration
# Version: 1.0.0
# Purpose: Defines AWS RDS PostgreSQL instance with high availability, encryption,
# and compliance requirements for estate planning data storage

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.0"
}

# Random ID for snapshot naming
resource "random_id" "snapshot_suffix" {
  byte_length = 4
}

# DB Parameter Group for PostgreSQL optimization
resource "aws_db_parameter_group" "estate_kit" {
  family = "postgres14"
  name   = "estate-kit-${var.environment}-pg14"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1 second
  }

  tags = local.common_tags
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring_role" {
  name = "estate-kit-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach Enhanced Monitoring Policy
resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# DB Subnet Group for Multi-AZ deployment
resource "aws_db_subnet_group" "estate_kit" {
  name        = "estate-kit-${var.environment}"
  description = "Subnet group for Estate Kit RDS instance with high availability"
  subnet_ids  = var.database_subnet_ids

  tags = local.common_tags
}

# Main RDS Instance
resource "aws_db_instance" "estate_kit" {
  identifier     = "estate-kit-${var.environment}"
  engine         = "postgres"
  engine_version = var.engine_version

  # Instance Configuration
  instance_class        = var.db_instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2 # Allow storage autoscaling up to 2x

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # High Availability Configuration
  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.estate_kit.name
  vpc_security_group_ids = var.vpc_security_group_ids

  # Storage Configuration
  storage_type      = "gp3"
  storage_encrypted = var.storage_encrypted

  # Backup Configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "estate-kit-${var.environment}-final-${random_id.snapshot_suffix.hex}"

  # Performance and Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = aws_iam_role.rds_monitoring_role.arn
  enabled_cloudwatch_logs_exports      = ["postgresql", "upgrade"]

  # Additional Configuration
  auto_minor_version_upgrade = true
  deletion_protection       = true
  parameter_group_name      = aws_db_parameter_group.estate_kit.name

  tags = local.common_tags
}

# Local variables for resource naming and tagging
locals {
  common_tags = {
    Project             = "Estate Kit"
    ManagedBy          = "Terraform"
    Environment        = var.environment
    SecurityCompliance = "PIPEDA"
    BackupStrategy     = "MultiAZ-WAL"
  }
}

# Outputs
output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.estate_kit.endpoint
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.estate_kit.arn
}

output "db_instance_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.estate_kit.id
}

output "db_instance_resource_id" {
  description = "The RDS instance resource ID for CloudWatch monitoring"
  value       = aws_db_instance.estate_kit.resource_id
}