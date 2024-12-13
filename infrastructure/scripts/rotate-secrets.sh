#!/bin/bash

# Estate Kit Secret Rotation Script
# Version: 1.0
# Purpose: Securely rotate Kubernetes secrets and encryption keys while maintaining service availability
# Required tools: kubectl v1.24+, aws-cli v2.0+
# Schedule: Monthly execution
# Security: Enhanced with AWS KMS encryption, audit logging, and validation

set -euo pipefail

# Global Variables
readonly NAMESPACE="${NAMESPACE:-estate-kit}"
readonly BACKUP_BUCKET="${BACKUP_BUCKET:-estate-kit-secret-backups}"
readonly GRACE_PERIOD_DAYS="${GRACE_PERIOD_DAYS:-7}"
readonly LOG_FILE="${LOG_FILE:-/var/log/estate-kit/secret-rotation.log}"
readonly ROTATION_LOCK_PATH="${ROTATION_LOCK_PATH:-/var/run/estate-kit/rotation.lock}"
readonly BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-90}"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging function with ISO8601 timestamps
log() {
    local level=$1
    shift
    echo "$(date -u '+%Y-%m-%dT%H:%M:%S.%3NZ') [$level] $*" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
    local exit_code=$?
    log "ERROR" "An error occurred on line $1"
    if [ -f "$ROTATION_LOCK_PATH" ]; then
        rm -f "$ROTATION_LOCK_PATH"
    fi
    exit "$exit_code"
}

trap 'handle_error $LINENO' ERR

# Check prerequisites and validate environment
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Verify required tools
    for cmd in kubectl aws base64 openssl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command not found: $cmd"
            return 1
        fi
    done

    # Verify Kubernetes access
    if ! kubectl auth can-i get secrets -n "$NAMESPACE" &> /dev/null; then
        log "ERROR" "Insufficient Kubernetes permissions"
        return 1
    fi

    # Verify AWS credentials and permissions
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "Invalid AWS credentials"
        return 1
    }

    # Check for concurrent rotation lock
    if [ -f "$ROTATION_LOCK_PATH" ]; then
        log "ERROR" "Another rotation process is running"
        return 1
    }

    # Create rotation lock
    touch "$ROTATION_LOCK_PATH"
    
    log "INFO" "Prerequisites check passed"
    return 0
}

# Create encrypted backup of secrets
backup_secrets() {
    local namespace=$1
    local backup_path="s3://${BACKUP_BUCKET}/${namespace}/secrets_${TIMESTAMP}.yaml"
    
    log "INFO" "Creating encrypted backup of secrets..."

    # Export current secrets
    kubectl get secrets -n "$namespace" -o yaml | \
        aws kms encrypt \
            --key-id "$(kubectl get secret aws-credentials -n "$namespace" -o jsonpath='{.data.AWS_KMS_KEY_ID}' | base64 -d)" \
            --plaintext fileb:- \
            --output text \
            --query CiphertextBlob | \
        aws s3 cp - "$backup_path"

    # Verify backup
    if ! aws s3 ls "$backup_path" &> /dev/null; then
        log "ERROR" "Backup verification failed"
        return 1
    }

    # Clean up old backups
    aws s3 ls "s3://${BACKUP_BUCKET}/${namespace}/" | \
        awk -v cutoff=$(date -d "-${BACKUP_RETENTION_DAYS} days" +%s) '
        $1 > cutoff {print $4}' | \
        xargs -r aws s3 rm

    log "INFO" "Backup created successfully at $backup_path"
    echo "$backup_path"
}

# Rotate database credentials
rotate_database_credentials() {
    local namespace=$1
    log "INFO" "Rotating database credentials..."

    # Generate new secure password
    local new_password=$(openssl rand -base64 32)
    local current_password=$(kubectl get secret database-credentials -n "$namespace" -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
    
    # Update database password with retry mechanism
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if PGPASSWORD="$current_password" psql -h "$(kubectl get secret database-credentials -n "$namespace" -o jsonpath='{.data.POSTGRES_HOST}' | base64 -d)" \
            -U "$(kubectl get secret database-credentials -n "$namespace" -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)" \
            -c "ALTER USER current_user WITH PASSWORD '$new_password';" &> /dev/null; then
            break
        fi
        ((retry_count++))
        log "WARN" "Database password update retry $retry_count of $max_retries"
        sleep 5
    done

    if [ $retry_count -eq $max_retries ]; then
        log "ERROR" "Failed to update database password after $max_retries attempts"
        return 1
    fi

    # Update Kubernetes secret
    kubectl create secret generic database-credentials \
        --namespace "$namespace" \
        --from-literal=POSTGRES_PASSWORD="$new_password" \
        --dry-run=client -o yaml | \
        kubectl apply -f -

    # Verify connectivity with new credentials
    sleep 5
    if ! PGPASSWORD="$new_password" psql -h "$(kubectl get secret database-credentials -n "$namespace" -o jsonpath='{.data.POSTGRES_HOST}' | base64 -d)" \
        -U "$(kubectl get secret database-credentials -n "$namespace" -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)" \
        -c "\l" &> /dev/null; then
        log "ERROR" "Failed to verify new database credentials"
        return 1
    }

    log "INFO" "Database credentials rotated successfully"
    return 0
}

# Rotate encryption keys
rotate_encryption_keys() {
    local namespace=$1
    log "INFO" "Rotating encryption keys..."

    # Generate new AES-256 key using AWS KMS
    local new_key=$(aws kms generate-data-key \
        --key-id "$(kubectl get secret aws-credentials -n "$namespace" -o jsonpath='{.data.AWS_KMS_KEY_ID}' | base64 -d)" \
        --key-spec AES_256 \
        --output text \
        --query Plaintext)

    # Create new KMS key version
    local new_key_version=$(aws kms create-key \
        --description "Estate Kit Encryption Key - ${TIMESTAMP}" \
        --tags TagKey=application,TagValue=estate-kit \
        --output text \
        --query KeyMetadata.KeyId)

    # Update Kubernetes secret with new key
    kubectl create secret generic encryption-keys \
        --namespace "$namespace" \
        --from-literal=AES_KEY="$new_key" \
        --from-literal=KEY_ROTATION_TIMESTAMP="$TIMESTAMP" \
        --dry-run=client -o yaml | \
        kubectl apply -f -

    # Schedule old key deletion
    aws kms schedule-key-deletion \
        --key-id "$(kubectl get secret aws-credentials -n "$namespace" -o jsonpath='{.data.AWS_KMS_KEY_ID}' | base64 -d)" \
        --pending-window-in-days "$GRACE_PERIOD_DAYS"

    log "INFO" "Encryption keys rotated successfully"
    return 0
}

# Main rotation function
rotate_all_secrets() {
    log "INFO" "Starting secret rotation process..."

    # Check prerequisites
    if ! check_prerequisites; then
        log "ERROR" "Prerequisites check failed"
        exit 1
    }

    # Create backup
    local backup_path
    backup_path=$(backup_secrets "$NAMESPACE")
    if [ $? -ne 0 ]; then
        log "ERROR" "Backup failed"
        exit 1
    }

    # Rotate database credentials
    if ! rotate_database_credentials "$NAMESPACE"; then
        log "ERROR" "Database credential rotation failed"
        # Restore from backup
        aws s3 cp "$backup_path" - | \
            aws kms decrypt \
                --ciphertext-blob fileb:- \
                --output text \
                --query Plaintext | \
            kubectl apply -f -
        exit 1
    }

    # Rotate encryption keys
    if ! rotate_encryption_keys "$NAMESPACE"; then
        log "ERROR" "Encryption key rotation failed"
        exit 1
    }

    # Clean up
    rm -f "$ROTATION_LOCK_PATH"
    log "INFO" "Secret rotation completed successfully"
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    rotate_all_secrets
fi