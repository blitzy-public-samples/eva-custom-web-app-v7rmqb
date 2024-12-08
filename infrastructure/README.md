# Estate Kit Infrastructure Documentation

This document provides detailed instructions for configuring, deploying, and managing the infrastructure components of the Estate Kit platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Overview](#infrastructure-overview)
3. [AWS Infrastructure](#aws-infrastructure)
4. [Kubernetes Setup](#kubernetes-setup)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security & Compliance](#security--compliance)
7. [Maintenance & Operations](#maintenance--operations)

## Prerequisites

Before proceeding with the infrastructure setup, ensure you have the following tools installed:

- AWS CLI v2.0+
- Terraform v1.0+
- kubectl v1.24+
- Docker v20+
- Helm v3+

## Infrastructure Overview

The Estate Kit platform uses a cloud-native architecture deployed on AWS with the following key components:

- VPC and networking infrastructure
- EKS for container orchestration
- RDS for PostgreSQL database
- S3 for document storage
- ECR for container registry

### Directory Structure

```
infrastructure/
├── docker/                 # Docker Compose configurations
├── kubernetes/            # Kubernetes manifests
├── scripts/              # Infrastructure management scripts
└── terraform/            # Terraform configurations
    └── aws/             # AWS-specific Terraform modules
```

## AWS Infrastructure

### VPC Setup

The VPC is configured with public and private subnets across multiple availability zones:

```bash
cd infrastructure/terraform/aws/vpc
terraform init
terraform apply
```

### S3 Configuration

Document storage is handled through S3 buckets with appropriate encryption:

```bash
cd infrastructure/terraform/aws/s3
terraform init
terraform apply
```

### RDS Setup

PostgreSQL database is deployed using Amazon RDS:

```bash
cd infrastructure/terraform/aws/rds
terraform init
terraform apply
```

### ECR Configuration

Container images are stored in Amazon ECR:

```bash
cd infrastructure/terraform/aws/ecr
terraform init
terraform apply
```

## Kubernetes Setup

### Cluster Configuration

The EKS cluster is deployed using Terraform:

```bash
cd infrastructure/terraform/aws/eks
terraform init
terraform apply
```

### Application Deployment

1. Create the required namespaces:
```bash
kubectl apply -f infrastructure/kubernetes/base/namespace.yaml
```

2. Configure secrets and config maps:
```bash
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml
```

3. Deploy frontend and backend services:
```bash
kubectl apply -f infrastructure/kubernetes/frontend/deployment.yaml
kubectl apply -f infrastructure/kubernetes/backend/deployment.yaml
```

## Monitoring & Observability

### Prometheus & Grafana Setup

1. Deploy monitoring stack:
```bash
./infrastructure/scripts/setup-monitoring.sh
```

2. Access monitoring dashboards:
- Prometheus: https://prometheus.estatekit.com
- Grafana: https://grafana.estatekit.com

### Logging Configuration

Logs are centralized using CloudWatch Logs with the following components:
- Application logs
- VPC Flow Logs
- Container logs
- Database logs

## Security & Compliance

### Secret Management

Secrets are managed using a combination of:
- AWS Secrets Manager
- Kubernetes Secrets
- HashiCorp Vault (optional)

To rotate secrets:
```bash
./infrastructure/scripts/rotate-secrets.sh
```

### Backup Procedures

Database backups are automated using:
```bash
./infrastructure/scripts/backup-db.sh
```

## Maintenance & Operations

### Staging Environment

For staging deployments:
```bash
docker-compose -f infrastructure/docker/docker-compose.staging.yml up -d
```

### Production Environment

For production deployments:
```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Health Checks

Monitor the health of services:
```bash
kubectl get pods -n estate-kit-production
kubectl describe pods -n estate-kit-production
```

## Troubleshooting

Common issues and their solutions:

1. Database Connection Issues
   - Verify security group rules
   - Check RDS instance status
   - Validate credentials in secrets

2. Container Deployment Failures
   - Check pod logs: `kubectl logs <pod-name> -n estate-kit-production`
   - Verify resource limits
   - Check image pull status

3. Monitoring Alert Resolution
   - Review Prometheus alerts
   - Check Grafana dashboards
   - Verify service metrics

## Support

For infrastructure-related issues:
- Email: admin@estatekit.com
- Internal Documentation: https://docs.estatekit.com/infrastructure