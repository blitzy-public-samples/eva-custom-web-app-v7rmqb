# Variables for AWS ECR Configuration
# Addresses requirement: Container Image Storage Configuration
# Technical Specifications/2.5 Deployment Architecture

variable "ecr_repository_name" {
  description = "The name of the ECR repository for container images."
  type        = string
}

variable "ecr_image_tag_mutability" {
  description = "The tag mutability setting for the ECR repository (e.g., MUTABLE or IMMUTABLE)."
  type        = string
  default     = "MUTABLE"
}

variable "ecr_image_scan_on_push" {
  description = "Specifies whether to enable image scanning on push for the ECR repository."
  type        = bool
  default     = true
}

variable "ecr_lifecycle_policy" {
  description = "The JSON file path for the ECR lifecycle policy."
  type        = string
}

variable "tags" {
  description = "Tags to apply to the ECR repository."
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Service     = "container-registry"
  }
}