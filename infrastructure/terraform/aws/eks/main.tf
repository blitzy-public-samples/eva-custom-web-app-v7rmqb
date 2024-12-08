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
# 1. Review and adjust node instance types based on workload requirements
# 2. Verify subnet configurations match network architecture
# 3. Review IAM roles and policies for compliance requirements
# 4. Configure kubectl access for cluster administrators
# 5. Set up monitoring and logging tools after cluster creation

# Data source for VPC
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = var.s3_bucket_name
    key    = "vpc/terraform.tfstate"
    region = var.aws_region
  }
}

# IAM role for EKS cluster
# Addresses requirement: Elastic Kubernetes Service (EKS) Deployment
# Technical Specifications/2.5 Deployment Architecture
resource "aws_iam_role" "eks_cluster" {
  name = "estate-kit-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.eks_tags
}

# Attach required policies to EKS cluster role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# IAM role for EKS node group
resource "aws_iam_role" "eks_node_group" {
  name = "estate-kit-eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.eks_tags
}

# Attach required policies to node group role
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# Security group for EKS cluster
resource "aws_security_group" "eks_cluster" {
  name        = "estate-kit-eks-cluster-sg"
  description = "Security group for Estate Kit EKS cluster"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS inbound for Kubernetes API server"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.eks_tags,
    {
      Name = "estate-kit-eks-cluster-sg"
    }
  )
}

# EKS Cluster
# Addresses requirement: Elastic Kubernetes Service (EKS) Deployment
# Technical Specifications/2.5 Deployment Architecture
resource "aws_eks_cluster" "main" {
  name     = var.eks_cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.24"

  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = var.eks_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# KMS key for EKS cluster encryption
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = var.eks_tags
}

# EKS Node Group
# Addresses requirement: Elastic Kubernetes Service (EKS) Deployment
# Technical Specifications/2.5 Deployment Architecture
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = var.eks_node_group_name
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    desired_size = var.eks_node_desired_capacity
    min_size     = var.eks_node_min_size
    max_size     = var.eks_node_max_size
  }

  instance_types = ["t3.medium"]
  disk_size      = 50
  capacity_type  = "ON_DEMAND"

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = "application"
  }

  tags = var.eks_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry
  ]
}

# CloudWatch Log Group for EKS cluster logs
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.eks_cluster_name}/cluster"
  retention_in_days = 30

  tags = var.eks_tags
}

# Outputs
output "eks_cluster_id" {
  description = "The ID of the created EKS cluster"
  value       = aws_eks_cluster.main.id
}

output "eks_cluster_endpoint" {
  description = "The endpoint of the created EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_node_group_arn" {
  description = "The ARN of the created EKS node group"
  value       = aws_eks_node_group.main.arn
}