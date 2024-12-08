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

# ECR Repository resource
# Addresses requirement: Container Image Storage
# Technical Specifications/2.5 Deployment Architecture
resource "aws_ecr_repository" "main" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  # Configure encryption using AWS KMS
  encryption_configuration {
    encryption_type = "KMS"
  }

  # Enable image tag immutability to prevent tag overwriting
  tags = {
    Name        = "estate-kit-ecr"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# ECR Lifecycle Policy
# Implements automated cleanup of old images to manage storage costs
resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name
  policy     = file("ecr-lifecycle-policy.json")
}

# ECR Repository Policy
# Implements secure access controls for the repository
resource "aws_ecr_repository_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPullPush"
        Effect = "Allow"
        Principal = {
          AWS = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

# Data source to get AWS account ID
data "aws_caller_identity" "current" {}

# Output the ECR repository URL
output "ecr_repository_url" {
  description = "The URL of the created ECR repository"
  value       = aws_ecr_repository.main.repository_url
}