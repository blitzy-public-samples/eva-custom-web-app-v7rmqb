#!/bin/bash

# Human Tasks:
# 1. Ensure AWS CLI v2.0 is installed and configured with appropriate credentials
# 2. Verify PostgreSQL client tools (pg_dump) v14.0 are installed
# 3. Configure appropriate IAM roles/permissions for S3 bucket access
# 4. Validate that database-credentials secret exists in Kubernetes
# 5. Set up proper log rotation for the backup logs

# Requirements Addressed:
# - Database Backup Automation (Technical Specifications/2.7 Cross-Cutting Concerns/Disaster Recovery)
#   Implements automated database backups to ensure data recovery in case of system failures.
# - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
#   Ensures that database backups are securely stored and encrypted in AWS S3.

# Set error handling
set -euo pipefail

# Configure logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/estate-kit"
LOG_FILE="${LOG_DIR}/db-backup-$(date +%Y-%m-%d).log"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Logging function
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] $1" | tee -a "${LOG_FILE}"
}

# Function to clean up temporary files
cleanup() {
    if [[ -f "${BACKUP_FILE}" ]]; then
        log "Cleaning up temporary backup file"
        rm -f "${BACKUP_FILE}"
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Function to retrieve Kubernetes secret
get_secret() {
    local secret_name="$1"
    local secret_key="$2"
    kubectl get secret "${secret_name}" -n estate-kit -o jsonpath="{.data.${secret_key}}" | base64 --decode
}

# Function to perform database backup
backup_database() {
    # Generate timestamp for backup file
    local timestamp=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="/tmp/estate-kit-db-backup-${timestamp}.sql.gz"
    
    # Retrieve database credentials from Kubernetes secrets
    log "Retrieving database credentials from Kubernetes secrets"
    DB_USER=$(get_secret "database-credentials" "DB_USER")
    DB_PASSWORD=$(get_secret "database-credentials" "DB_PASSWORD")
    DB_HOST=$(get_secret "database-credentials" "DB_HOST")
    DB_PORT=$(get_secret "database-credentials" "DB_PORT")
    
    # Retrieve S3 bucket name from Terraform state
    S3_BUCKET_NAME=$(terraform output -state="${SCRIPT_DIR}/../terraform/aws/terraform.tfstate" s3_bucket_name)
    
    # Perform database backup
    log "Starting database backup using pg_dump"
    if PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USER}" \
        --format=custom \
        --verbose \
        --compress=9 \
        --file="${BACKUP_FILE}" \
        estatekit; then
        log "Database backup completed successfully"
        
        # Upload to S3 with server-side encryption
        log "Uploading backup to S3 bucket: ${S3_BUCKET_NAME}"
        if aws s3 cp \
            "${BACKUP_FILE}" \
            "s3://${S3_BUCKET_NAME}/database-backups/$(basename ${BACKUP_FILE})" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log "Backup successfully uploaded to S3"
            return 0
        else
            log "ERROR: Failed to upload backup to S3"
            return 1
        fi
    else
        log "ERROR: Database backup failed"
        return 1
    fi
}

# Main execution
log "Starting database backup process"

if backup_database; then
    log "Database backup process completed successfully"
    exit 0
else
    log "Database backup process failed"
    exit 1
fi