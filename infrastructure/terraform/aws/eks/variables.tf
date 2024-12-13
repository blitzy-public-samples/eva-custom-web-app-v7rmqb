# terraform ~> 1.0

# Cluster Name Variable
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster for Estate Kit platform"
  default     = "estate-kit-eks"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and can only contain letters, numbers, and hyphens."
  }
}

# Kubernetes Version Variable
variable "cluster_version" {
  type        = string
  description = "Kubernetes version for the EKS cluster"
  default     = "1.24"

  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+$", var.cluster_version))
    error_message = "Cluster version must be in the format 'X.Y' (e.g., '1.24')."
  }
}

# Node Groups Configuration Variable
variable "node_groups" {
  type        = map(any)
  description = "Configuration for EKS managed node groups with auto-scaling and instance specifications"
  default = {
    application = {
      name           = "app-node-group"
      instance_types = ["t3.large"]
      min_size      = 3
      max_size      = 10
      desired_size  = 3
      disk_size     = 50
    }
    service = {
      name           = "svc-node-group"
      instance_types = ["t3.medium"]
      min_size      = 2
      max_size      = 5
      desired_size  = 2
      disk_size     = 30
    }
  }

  validation {
    condition = alltrue([
      for k, v in var.node_groups : (
        can(v.name) &&
        can(v.instance_types) &&
        can(v.min_size) &&
        can(v.max_size) &&
        can(v.desired_size) &&
        can(v.disk_size) &&
        v.min_size <= v.desired_size &&
        v.desired_size <= v.max_size &&
        v.disk_size >= 20
      )
    ])
    error_message = "Node groups configuration is invalid. Check size constraints and required fields."
  }
}

# Resource Tags Variable
variable "tags" {
  type        = map(string)
  description = "Tags to be applied to all EKS resources for proper resource management and cost allocation"
  default = {
    Environment = "production"
    Project     = "estate-kit"
    ManagedBy   = "terraform"
  }

  validation {
    condition = alltrue([
      for k, v in var.tags : (
        can(regex("^[a-zA-Z][a-zA-Z0-9_-]*$", k)) &&
        can(regex("^[a-zA-Z0-9_-]+$", v))
      )
    ])
    error_message = "Tags must have valid keys (start with letter, alphanumeric with hyphens and underscores) and values (alphanumeric with hyphens and underscores)."
  }
}