# Outputs for AWS Infrastructure
# Addresses requirement: Infrastructure Outputs Consolidation
# Technical Specifications/2.5 Deployment Architecture

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "subnet_ids" {
  description = "List of subnet IDs (both public and private)"
  value = {
    public  = module.vpc.public_subnet_ids
    private = module.vpc.private_subnet_ids
  }
}

# S3 Outputs
output "s3_bucket_name" {
  description = "The name of the S3 bucket for document storage"
  value       = module.s3.s3_bucket_name
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket for document storage"
  value       = module.s3.s3_bucket_arn
}

# RDS Outputs
output "rds_instance_id" {
  description = "The ID of the RDS instance"
  value       = module.rds.rds_instance_id
}

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.rds.rds_endpoint
}

# ECR Outputs
output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = module.ecr.ecr_repository_url
}

# EKS Outputs
output "eks_cluster_id" {
  description = "The ID of the EKS cluster"
  value       = module.eks.eks_cluster_id
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster API server"
  value       = module.eks.eks_cluster_endpoint
}

# Additional metadata outputs
output "infrastructure_metadata" {
  description = "Metadata about the infrastructure deployment"
  value = {
    region          = var.aws_region
    environment     = var.tags["Environment"]
    managed_by      = var.tags["ManagedBy"]
    project         = var.tags["Project"]
    creation_date   = timestamp()
  }
}