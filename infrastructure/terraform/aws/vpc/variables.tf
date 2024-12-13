# Terraform variables configuration for Estate Kit VPC infrastructure
# Version: ~> 1.0

variable "vpc_name" {
  type        = string
  description = "Name of the VPC for Estate Kit platform"
  default     = "estate-kit-vpc"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "azs" {
  type        = list(string)
  description = "List of availability zones for VPC subnets"
  default     = ["ca-central-1a", "ca-central-1b"]
}

variable "private_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for private subnets"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for public subnets"
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Enable NAT Gateway for private subnet internet access"
  default     = true
}

variable "enable_vpn_gateway" {
  type        = bool
  description = "Enable VPN Gateway for VPC"
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "Tags to be applied to all VPC resources"
  default = {
    Environment = "production"
    Project     = "estate-kit"
    ManagedBy   = "terraform"
  }
}