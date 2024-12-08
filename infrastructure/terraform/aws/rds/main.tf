# AWS Provider configuration
# AWS Provider version 4.0.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
  }
}

# Human Tasks:
# 1. Configure database master username and password in AWS Secrets Manager
# 2. Review and adjust the security group CIDR blocks based on network requirements
# 3. Verify backup window and maintenance window align with business requirements
# 4. Ensure subnet IDs are correctly specified in terraform.tfvars
# 5. Review and adjust RDS parameter group settings if needed

# Data source for VPC
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "estate-kit-terraform-state"
    key    = "vpc/terraform.tfstate"
    region = var.aws_region
  }
}

# Data source for S3
data "terraform_remote_state" "s3" {
  backend = "s3"
  config = {
    bucket = "estate-kit-terraform-state"
    key    = "s3/terraform.tfstate"
    region = var.aws_region
  }
}

# RDS DB Subnet Group
# Addresses requirement: Database Infrastructure Setup
# Technical Specifications/2.5 Deployment Architecture
resource "aws_db_subnet_group" "rds" {
  name        = "estate-kit-rds-subnet-group"
  description = "Subnet group for Estate Kit RDS instance"
  subnet_ids  = var.subnet_ids

  tags = var.rds_tags
}

# RDS Security Group
# Addresses requirement: Database Infrastructure Setup
# Technical Specifications/2.5 Deployment Architecture
resource "aws_security_group" "rds" {
  name        = "estate-kit-rds-security-group"
  description = "Security group for Estate Kit RDS instance"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id

  # PostgreSQL access
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = var.rds_tags
}

# RDS Parameter Group
resource "aws_db_parameter_group" "rds" {
  family = "postgres14"
  name   = "estate-kit-rds-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  tags = var.rds_tags
}

# RDS Instance
# Addresses requirement: Database Infrastructure Setup
# Technical Specifications/2.5 Deployment Architecture
resource "aws_db_instance" "main" {
  identifier = "estate-kit-db"

  # Engine configuration
  engine         = var.rds_engine
  engine_version = var.rds_engine_version
  instance_class = var.rds_instance_class

  # Storage configuration
  allocated_storage     = var.rds_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = var.rds_storage_encrypted
  max_allocated_storage = var.rds_allocated_storage * 2

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az              = var.rds_multi_az
  publicly_accessible   = false

  # Database configuration
  db_name  = "estatekit"
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Backup and maintenance configuration
  backup_retention_period = var.rds_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot  = true

  # Monitoring and logging
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Parameter group
  parameter_group_name = aws_db_parameter_group.rds.name

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Deletion protection
  deletion_protection = true

  tags = var.rds_tags
}

# IAM role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "estate-kit-rds-monitoring-role"

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

  tags = var.rds_tags
}

# Attach the enhanced monitoring policy to the role
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Outputs
output "rds_instance_id" {
  description = "The ID of the created RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_endpoint" {
  description = "The endpoint of the created RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "The port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "The name of the database"
  value       = aws_db_instance.main.db_name
}