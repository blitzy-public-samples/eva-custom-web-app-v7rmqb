# Estate Kit AWS Infrastructure Outputs Configuration
# Version: 1.0.0
# Purpose: Defines secure output values for critical infrastructure components
# with enhanced security controls and comprehensive documentation

# VPC Outputs
output "vpc_id" {
  description = "ID of the created VPC with enhanced security groups and network ACLs"
  value       = module.vpc.vpc_id
  sensitive   = false
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for secure workload deployment"
  value       = module.vpc.private_subnet_ids
  sensitive   = false
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for load balancer and NAT gateway placement"
  value       = module.vpc.public_subnet_ids
  sensitive   = false
}

# RDS Database Outputs
output "database_endpoint" {
  description = "RDS database connection endpoint with encryption and security protocols"
  value       = module.rds.db_instance_endpoint
  sensitive   = true # Marked sensitive to prevent exposure in logs
}

output "database_arn" {
  description = "RDS database ARN for IAM and resource policies"
  value       = module.rds.db_instance_arn
  sensitive   = false
}

output "database_status" {
  description = "Current status of the RDS instance for monitoring"
  value       = module.rds.db_instance_status
  sensitive   = false
}

# EKS Cluster Outputs
output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint with security group access controls"
  value       = module.eks.cluster_endpoint
  sensitive   = true # Marked sensitive to prevent exposure in logs
}

output "eks_cluster_id" {
  description = "EKS cluster identifier for resource management"
  value       = module.eks.cluster_id
  sensitive   = false
}

output "eks_cluster_certificate" {
  description = "EKS cluster CA certificate data for secure communication"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true # Marked sensitive as it contains security credentials
}

output "eks_cluster_status" {
  description = "Current status of the EKS cluster for monitoring"
  value       = module.eks.cluster_status
  sensitive   = false
}

# Region Configuration Outputs
output "primary_region" {
  description = "Primary AWS region (ca-central-1) for deployment"
  value       = var.aws_region
  sensitive   = false
}

output "backup_region" {
  description = "Backup AWS region (us-east-1) for disaster recovery"
  value       = var.aws_backup_region
  sensitive   = false
}

# Local Variables for Output Processing
locals {
  # Add timestamp to sensitive outputs for audit tracking
  output_metadata = {
    timestamp     = timestamp()
    environment   = var.environment
    project       = var.project
    compliance    = "PIPEDA"
  }
}