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

# Data source for IAM policy document
# Defines the bucket policy for secure access control
data "aws_iam_policy_document" "s3_bucket_policy" {
  statement {
    sid    = "EnforceSSLOnly"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}",
      "arn:aws:s3:::${var.s3_bucket_name}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "AllowVPCEndpointAccess"
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}",
      "arn:aws:s3:::${var.s3_bucket_name}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:sourceVpc"
      values   = [data.terraform_remote_state.vpc.outputs.vpc_id]
    }
  }
}

# S3 Bucket resource
# Addresses requirement: Document Storage Infrastructure
# Technical Specifications/2.3 Component Details/Document Service
resource "aws_s3_bucket" "estate-kit-documents" {
  bucket = var.s3_bucket_name
  acl    = "private"

  # Enable versioning for document history and recovery
  versioning {
    enabled = true
  }

  # Configure server-side encryption for data at rest
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # Configure lifecycle rules for version management
  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true

    noncurrent_version_expiration {
      days = 30
    }
  }

  # Configure logging for audit purposes
  logging {
    target_bucket = aws_s3_bucket.estate-kit-logs.id
    target_prefix = "s3-access-logs/"
  }

  tags = {
    Name        = "estate-kit-documents"
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "document-storage"
  }
}

# S3 Bucket for access logs
resource "aws_s3_bucket" "estate-kit-logs" {
  bucket = "${var.s3_bucket_name}-logs"
  acl    = "log-delivery-write"

  # Enable server-side encryption for logs
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # Configure lifecycle rules for log retention
  lifecycle_rule {
    id      = "expire-old-logs"
    enabled = true

    expiration {
      days = 90
    }
  }

  tags = {
    Name        = "estate-kit-document-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "document-storage-logs"
  }
}

# S3 Bucket Policy
# Enforces secure access and encryption requirements
resource "aws_s3_bucket_policy" "estate-kit-documents" {
  bucket = aws_s3_bucket.estate-kit-documents.id
  policy = data.aws_iam_policy_document.s3_bucket_policy.json
}

# S3 Bucket Public Access Block
# Ensures no public access is allowed
resource "aws_s3_bucket_public_access_block" "estate-kit-documents" {
  bucket = aws_s3_bucket.estate-kit-documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Output the S3 bucket name
output "s3_bucket_name" {
  description = "The name of the created S3 bucket"
  value       = aws_s3_bucket.estate-kit-documents.id
}

# Output the S3 bucket ARN
output "s3_bucket_arn" {
  description = "The ARN of the created S3 bucket"
  value       = aws_s3_bucket.estate-kit-documents.arn
}