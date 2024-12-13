# AWS ECR Configuration for Estate Kit Application
# Version: 1.0.0
# Provider version: hashicorp/aws ~> 4.0

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Local variables for common configurations
locals {
  common_tags = {
    Project             = var.project
    Environment         = var.environment
    ManagedBy          = "terraform"
    SecurityCompliance = "PIPEDA"
    DataClassification = "Confidential"
  }

  # Enhanced policy for secure access
  base_repository_policy = {
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "ecr:*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  }
}

# ECR Repository Creation with Enhanced Security
resource "aws_ecr_repository" "estate_kit_repositories" {
  for_each = var.repository_names

  name                 = each.value
  image_tag_mutability = "IMMUTABLE" # Enforce immutable tags for audit compliance

  # Enhanced security scanning configuration
  image_scanning_configuration {
    scan_on_push = true
  }

  # Server-side encryption configuration
  encryption_configuration {
    encryption_type = "KMS"
    kms_key = "aws/ecr"
  }

  # Force delete protection for production
  force_delete = var.environment != "production"

  tags = merge(local.common_tags, {
    Name = each.value
    SecurityScan = "enabled"
    DataRetention = "30days"
  })
}

# Repository Security Policies
resource "aws_ecr_repository_policy" "estate_kit_repository_policies" {
  for_each = var.repository_names

  repository = aws_ecr_repository.estate_kit_repositories[each.key].name
  policy = jsonencode(merge(local.base_repository_policy, {
    Statement = concat(local.base_repository_policy.Statement, [
      {
        Sid       = "LimitPushAccess"
        Effect    = "Allow"
        Principal = {
          AWS = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action    = [
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ])
  }))
}

# Enhanced Lifecycle Policies
resource "aws_ecr_lifecycle_policy" "estate_kit_lifecycle_policies" {
  for_each = var.repository_names

  repository = aws_ecr_repository.estate_kit_repositories[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Retain tagged production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["prod", "release"]
          countType     = "imageCountMoreThan"
          countNumber   = var.image_retention_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Clean up untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Output repository URLs for CI/CD integration
output "repository_urls" {
  description = "Map of repository names to their URLs"
  value = {
    for key, repo in aws_ecr_repository.estate_kit_repositories :
    key => repo.repository_url
  }
}

# Output repository ARNs for IAM policy attachment
output "repository_arns" {
  description = "Map of repository names to their ARNs"
  value = {
    for key, repo in aws_ecr_repository.estate_kit_repositories :
    key => repo.arn
  }
}