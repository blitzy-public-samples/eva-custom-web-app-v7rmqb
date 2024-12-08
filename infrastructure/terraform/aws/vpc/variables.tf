# Human Tasks:
# 1. Review and adjust the CIDR blocks according to your network design requirements
# 2. Verify that the DNS settings align with your infrastructure needs
# 3. Customize the tags based on your organization's tagging strategy

# Addresses requirement: Infrastructure Parameterization
# Technical Specifications/2.5 Deployment Architecture
# Centralizes configuration parameters for AWS resources

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"  # Default CIDR block for the VPC

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "The vpc_cidr value must be a valid CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]  # Default CIDR blocks for public subnets

  validation {
    condition     = length([for cidr in var.public_subnet_cidrs : cidr if can(cidrhost(cidr, 0))]) == length(var.public_subnet_cidrs)
    error_message = "All public subnet CIDR blocks must be valid CIDR notations."
  }
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]  # Default CIDR blocks for private subnets

  validation {
    condition     = length([for cidr in var.private_subnet_cidrs : cidr if can(cidrhost(cidr, 0))]) == length(var.private_subnet_cidrs)
    error_message = "All private subnet CIDR blocks must be valid CIDR notations."
  }
}

variable "enable_dns_support" {
  description = "Whether to enable DNS support in the VPC"
  type        = bool
  default     = true  # Enable DNS support by default for name resolution

  validation {
    condition     = can(tobool(var.enable_dns_support))
    error_message = "The enable_dns_support value must be a boolean."
  }
}

variable "enable_dns_hostnames" {
  description = "Whether to enable DNS hostnames in the VPC"
  type        = bool
  default     = true  # Enable DNS hostnames by default for EC2 instance naming

  validation {
    condition     = can(tobool(var.enable_dns_hostnames))
    error_message = "The enable_dns_hostnames value must be a boolean."
  }
}

variable "tags" {
  description = "Tags to apply to the VPC and its associated resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "estate-kit"
  }

  validation {
    condition     = length(var.tags) > 0
    error_message = "At least one tag must be provided."
  }
}