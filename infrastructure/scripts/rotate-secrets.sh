#!/bin/bash

# Estate Kit - Secret Rotation Script
# Requirements addressed:
# - Data Security (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
#   Ensures sensitive data such as API keys and database credentials are securely rotated.
# - Environment-Specific Configuration (Technical Specifications/2.5 Deployment Architecture)
#   Supports environment-specific secret rotation for staging, production, and development environments.

# Human Tasks:
# 1. Configure AWS credentials with appropriate permissions for secret rotation
# 2. Set up monitoring alerts for failed secret rotations
# 3. Review and update secret rotation policies periodically
# 4. Ensure backup copies of secrets are properly secured
# 5. Verify service account permissions for Kubernetes operations

set -euo pipefail

# Load environment variables
AWS_REGION=${AWS_REGION:-"us-east-1"}
KUBE_CONTEXT=${KUBE_CONTEXT:-"production"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
BACKUP_BUCKET=${AWS_S3_BUCKET:-"estate-kit-secrets-backup"}

# Initialize logging
log_info() {
    echo "[INFO] $(date -u '+%Y-%m-%d %H:%M:%S UTC') - $1"
}

log_error() {
    echo "[ERROR] $(date -u '+%Y-%m-%d %H:%M:%S UTC') - $1" >&2
}

# Validate AWS credentials and connectivity
validate_aws_credentials() {
    log_info "Validating AWS credentials..."
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "Invalid AWS credentials. Please check your configuration."
        exit 1
    fi
}

# Validate Kubernetes context
validate_kubernetes_context() {
    log_info "Validating Kubernetes context..."
    if ! kubectl config use-context "$KUBE_CONTEXT" >/dev/null 2>&1; then
        log_error "Invalid Kubernetes context. Please check your kubeconfig."
        exit 1
    fi
}

# Backup current secrets to S3
backup_secrets() {
    local timestamp
    timestamp=$(date -u '+%Y%m%d_%H%M%S')
    local backup_path="s3://${BACKUP_BUCKET}/${ENVIRONMENT}/secrets_${timestamp}"

    log_info "Backing up secrets to ${backup_path}..."

    # Backup Kubernetes secrets
    kubectl get secrets -n estate-kit -o yaml > "/tmp/k8s_secrets_${timestamp}.yaml"
    aws s3 cp "/tmp/k8s_secrets_${timestamp}.yaml" "${backup_path}/kubernetes_secrets.yaml"
    rm -f "/tmp/k8s_secrets_${timestamp}.yaml"

    # Backup AWS Secrets Manager secrets
    aws secretsmanager list-secrets --region "$AWS_REGION" --query 'SecretList[].Name' --output text | \
    while read -r secret_name; do
        aws secretsmanager get-secret-value --secret-id "$secret_name" --region "$AWS_REGION" \
            --query 'SecretString' --output text > "/tmp/${secret_name}_${timestamp}.json"
        aws s3 cp "/tmp/${secret_name}_${timestamp}.json" "${backup_path}/aws_${secret_name}.json"
        rm -f "/tmp/${secret_name}_${timestamp}.json"
    done
}

# Rotate AWS Secrets Manager secrets
rotate_aws_secrets() {
    local secret_name=$1
    local new_value=$2

    log_info "Rotating AWS secret: ${secret_name}..."
    
    if aws secretsmanager update-secret \
        --secret-id "$secret_name" \
        --secret-string "$new_value" \
        --region "$AWS_REGION"; then
        log_info "Successfully rotated AWS secret: ${secret_name}"
        return 0
    else
        log_error "Failed to rotate AWS secret: ${secret_name}"
        return 1
    fi
}

# Rotate Kubernetes secrets
rotate_kubernetes_secrets() {
    local namespace=$1
    local secret_name=$2
    local new_value=$3

    log_info "Rotating Kubernetes secret: ${secret_name} in namespace ${namespace}..."

    # Create new secret value in base64
    local encoded_value
    encoded_value=$(echo -n "$new_value" | base64)

    # Update the secret
    if kubectl patch secret "$secret_name" -n "$namespace" \
        --type='json' \
        -p="[{\"op\": \"replace\", \"path\": \"/data/value\", \"value\": \"$encoded_value\"}]"; then
        
        # Restart dependent pods
        local pods
        pods=$(kubectl get pods -n "$namespace" -l "app.kubernetes.io/name=${secret_name%-*}" -o name)
        for pod in $pods; do
            kubectl delete "$pod" -n "$namespace"
        done
        
        log_info "Successfully rotated Kubernetes secret: ${secret_name}"
        return 0
    else
        log_error "Failed to rotate Kubernetes secret: ${secret_name}"
        return 1
    fi
}

# Rotate TLS certificates
rotate_tls_certificates() {
    local namespace=$1
    local certificate_name=$2

    log_info "Rotating TLS certificate: ${certificate_name}..."

    # Delete the existing certificate to trigger cert-manager to issue a new one
    if kubectl delete certificate "$certificate_name" -n "$namespace"; then
        # Wait for the new certificate to be issued
        local timeout=300
        local interval=10
        local elapsed=0
        
        while [ $elapsed -lt $timeout ]; do
            if kubectl get certificate "$certificate_name" -n "$namespace" | grep -q "True"; then
                log_info "Successfully rotated TLS certificate: ${certificate_name}"
                return 0
            fi
            sleep $interval
            elapsed=$((elapsed + interval))
        done
        
        log_error "Timeout waiting for certificate rotation: ${certificate_name}"
        return 1
    else
        log_error "Failed to rotate TLS certificate: ${certificate_name}"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting secret rotation process..."

    # Validate prerequisites
    validate_aws_credentials
    validate_kubernetes_context

    # Backup current secrets
    backup_secrets

    # Rotate AWS Secrets Manager secrets
    rotate_aws_secrets "database-credentials" "$(openssl rand -base64 32)"
    rotate_aws_secrets "api-keys" "$(openssl rand -base64 32)"

    # Rotate Kubernetes secrets
    rotate_kubernetes_secrets "estate-kit" "database-credentials" "$(openssl rand -base64 32)"
    rotate_kubernetes_secrets "estate-kit" "api-keys" "$(openssl rand -base64 32)"

    # Rotate TLS certificates
    rotate_tls_certificates "estate-kit" "estatekit-tls"

    log_info "Secret rotation process completed successfully"
}

# Execute main function
main "$@"