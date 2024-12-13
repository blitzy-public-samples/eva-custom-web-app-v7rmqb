# Estate Kit VPC Infrastructure Configuration
# Version: 1.0.0
# Purpose: Defines AWS VPC infrastructure with multi-AZ deployment, isolated subnets, and EKS support

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.0"
}

# Import AWS provider configuration
provider "aws" {
  # Provider configuration is expected to be defined in the root module
}

# VPC Module Configuration
# Using AWS VPC Module version ~> 3.0
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  # Basic VPC Configuration
  name = var.vpc_name
  cidr = var.vpc_cidr

  # Availability Zone Configuration
  azs = var.azs

  # Subnet Configuration
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  # NAT Gateway Configuration - One NAT Gateway per AZ for high availability
  enable_nat_gateway     = var.enable_nat_gateway
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  # VPN Gateway Configuration
  enable_vpn_gateway = var.enable_vpn_gateway

  # DNS Configuration
  enable_dns_hostnames = true
  enable_dns_support   = true

  # EKS-specific configurations
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.vpc_name}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.vpc_name}" = "shared"
  }

  # Default security group with no ingress/egress rules (explicit rules to be defined separately)
  manage_default_security_group = true
  default_security_group_ingress = []
  default_security_group_egress  = []

  # VPC Flow Logs for network monitoring
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true
  flow_log_max_aggregation_interval    = 60

  # Apply common tags to all resources
  tags = merge(var.tags, {
    Name = var.vpc_name
  })
}

# Output Definitions
output "vpc_id" {
  description = "ID of the created VPC for EKS cluster configuration"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for EKS node groups and application workloads"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for load balancers and public-facing components"
  value       = module.vpc.public_subnets
}