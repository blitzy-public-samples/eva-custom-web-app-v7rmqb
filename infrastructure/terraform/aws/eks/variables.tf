# Variables for EKS Configuration
# Addresses requirement: EKS Configuration
# Technical Specifications/2.5 Deployment Architecture

variable "eks_cluster_name" {
  description = "The name of the EKS cluster"
  type        = string
  default     = "estate-kit-cluster"
}

variable "eks_node_group_name" {
  description = "The name of the EKS node group"
  type        = string
  default     = "estate-kit-node-group"
}

variable "eks_node_instance_type" {
  description = "The instance type for the EKS nodes"
  type        = string
  default     = "t3.medium"
}

variable "eks_node_desired_capacity" {
  description = "The desired number of nodes in the EKS node group"
  type        = number
  default     = 2
}

variable "eks_node_min_size" {
  description = "The minimum number of nodes in the EKS node group"
  type        = number
  default     = 1
}

variable "eks_node_max_size" {
  description = "The maximum number of nodes in the EKS node group"
  type        = number
  default     = 4
}

variable "eks_node_ami_type" {
  description = "The AMI type for the EKS nodes"
  type        = string
  default     = "AL2_x86_64"  # Amazon Linux 2 AMD64
}

variable "eks_tags" {
  description = "Tags to apply to the EKS cluster and its associated resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "eks"
    Project     = "estate-kit"
  }
}

# Network Configuration
variable "subnet_ids" {
  description = "List of subnet IDs where the EKS cluster and nodes will be deployed"
  type        = list(string)
}

variable "aws_region" {
  description = "The AWS region where the EKS cluster will be created"
  type        = string
  default     = "us-west-2"
}

# State Management
variable "s3_bucket_name" {
  description = "The name of the S3 bucket for storing Terraform state"
  type        = string
}

# Additional Configuration
variable "eks_cluster_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.24"
}

variable "eks_cluster_log_retention" {
  description = "Number of days to retain EKS cluster logs in CloudWatch"
  type        = number
  default     = 30
}

variable "eks_node_disk_size" {
  description = "Disk size in GB for EKS worker nodes"
  type        = number
  default     = 50
}

variable "eks_node_capacity_type" {
  description = "Capacity type for the EKS node group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}