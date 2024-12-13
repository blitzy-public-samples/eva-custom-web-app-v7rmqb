#!/bin/bash

# Estate Kit Database Backup Script
# Version: 1.0.0
# Dependencies:
# - aws-cli v2.x
# - postgresql-client v14
# Purpose: Automated PostgreSQL database backups with AWS S3 storage and encryption

set -euo pipefail

# Global Configuration
BACKUP_BUCKET="estate-kit-${ENVIRONMENT}-backups"
DR_BACKUP_BUCKET="estate-kit-${ENVIRONMENT}-dr-backups"
BACKUP_PATH="/tmp/estate-kit-backups"
RETENTION_DAYS=30
COMPRESSION_LEVEL=9
MAX_PARALLEL_UPLOADS=4
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CORRELATION_ID=$(uuidgen)

# Logging Configuration
log() {
    local level=$1
    local message=$2
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ${level} - ${message} - ${CORRELATION_ID}" | tee -a /var/log/estate-kit/backups.log
    
    if [ "${level}" = "ERROR" ] || [ "${level}" = "FATAL" ]; then
        logger -t estate-kit-backup -p local0.error "${message}"
        aws cloudwatch put-metric-data --namespace EstateKit --metric-name BackupErrors --value 1 --unit Count
    fi
}

# Function to check all required dependencies and configurations
check_dependencies() {
    log "INFO" "Starting dependency checks"
    
    # Check required environment variables
    local required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "KMS_KEY_ID" "ENVIRONMENT")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log "FATAL" "Missing required environment variable: ${var}"
            return 1
        fi
    done
    
    # Verify PostgreSQL client tools
    if ! command -v pg_dump >/dev/null 2>&1; then
        log "FATAL" "pg_dump not found. Please install postgresql-client"
        return 1
    fi
    
    # Verify AWS CLI
    if ! command -v aws >/dev/null 2>&1; then
        log "FATAL" "AWS CLI not found. Please install aws-cli v2"
        return 1
    fi
    
    # Verify AWS credentials and permissions
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log "FATAL" "Invalid AWS credentials or permissions"
        return 1
    fi
    
    # Check S3 bucket access
    if ! aws s3 ls "s3://${BACKUP_BUCKET}" >/dev/null 2>&1; then
        log "FATAL" "Cannot access backup bucket: ${BACKUP_BUCKET}"
        return 1
    fi
    
    # Verify KMS key access
    if ! aws kms describe-key --key-id "${KMS_KEY_ID}" >/dev/null 2>&1; then
        log "FATAL" "Cannot access KMS key: ${KMS_KEY_ID}"
        return 1
    }
    
    # Check available disk space (need at least 20GB free)
    local available_space=$(df -BG "${BACKUP_PATH}" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "${available_space}" -lt 20 ]; then
        log "FATAL" "Insufficient disk space. Required: 20GB, Available: ${available_space}GB"
        return 1
    fi
    
    log "INFO" "All dependency checks passed"
    return 0
}

# Function to create database backup
create_backup() {
    local backup_file="${BACKUP_PATH}/estate-kit-${TIMESTAMP}.sql.gz"
    local metadata_file="${BACKUP_PATH}/estate-kit-${TIMESTAMP}.meta"
    
    log "INFO" "Starting backup creation"
    
    # Create backup directory with secure permissions
    mkdir -p "${BACKUP_PATH}"
    chmod 700 "${BACKUP_PATH}"
    
    # Create backup with compression and error handling
    if ! PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -Z "${COMPRESSION_LEVEL}" \
        -F c \
        -f "${backup_file}" 2>/tmp/pg_dump_error.log; then
        log "FATAL" "Backup creation failed: $(cat /tmp/pg_dump_error.log)"
        rm -f /tmp/pg_dump_error.log
        return 1
    fi
    
    # Calculate backup checksum
    local checksum=$(sha256sum "${backup_file}" | cut -d' ' -f1)
    
    # Create metadata file
    cat > "${metadata_file}" << EOF
timestamp: ${TIMESTAMP}
database: ${DB_NAME}
size: $(stat -f %z "${backup_file}")
checksum: ${checksum}
compression: gzip
compression_level: ${COMPRESSION_LEVEL}
encrypted: true
encryption_algorithm: AES-256
kms_key_id: ${KMS_KEY_ID}
EOF
    
    log "INFO" "Backup created successfully: ${backup_file}"
    echo "${backup_file}:${metadata_file}"
}

# Function to upload backup to S3
upload_to_s3() {
    local backup_file=$1
    local metadata_file=$2
    
    log "INFO" "Starting backup upload to S3"
    
    # Upload to primary bucket with server-side encryption
    if ! aws s3 cp "${backup_file}" \
        "s3://${BACKUP_BUCKET}/$(basename "${backup_file}")" \
        --sse aws:kms \
        --sse-kms-key-id "${KMS_KEY_ID}" \
        --metadata-directive REPLACE \
        --metadata "checksum=$(sha256sum "${backup_file}" | cut -d' ' -f1)"; then
        log "ERROR" "Failed to upload backup to primary bucket"
        return 1
    fi
    
    # Upload metadata file
    if ! aws s3 cp "${metadata_file}" \
        "s3://${BACKUP_BUCKET}/$(basename "${metadata_file}")"; then
        log "ERROR" "Failed to upload metadata to primary bucket"
        return 1
    fi
    
    # Verify cross-region replication
    log "INFO" "Waiting for cross-region replication"
    sleep 30  # Allow time for replication
    
    if ! aws s3 ls "s3://${DR_BACKUP_BUCKET}/$(basename "${backup_file}")" >/dev/null 2>&1; then
        log "ERROR" "Cross-region replication verification failed"
        return 1
    fi
    
    # Cleanup local files
    rm -f "${backup_file}" "${metadata_file}"
    
    log "INFO" "Backup upload completed successfully"
    return 0
}

# Function to clean up old backups
cleanup_old_backups() {
    log "INFO" "Starting backup cleanup"
    
    local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
    local cleaned=0
    
    # List and delete old backups from primary bucket
    while read -r backup; do
        local backup_date=$(echo "${backup}" | grep -oP '\d{8}')
        if [ "${backup_date}" -lt "${cutoff_date}" ]; then
            if aws s3 rm "s3://${BACKUP_BUCKET}/${backup}"; then
                cleaned=$((cleaned + 1))
                log "INFO" "Deleted old backup: ${backup}"
            else
                log "WARNING" "Failed to delete old backup: ${backup}"
            fi
        fi
    done < <(aws s3 ls "s3://${BACKUP_BUCKET}" | grep -oP 'estate-kit-\d{8}_\d{6}\.sql\.gz')
    
    log "INFO" "Cleaned up ${cleaned} old backups"
    return "${cleaned}"
}

# Main execution
main() {
    log "INFO" "Starting database backup process"
    
    # Create lock file to prevent parallel execution
    if ! mkdir /tmp/estate-kit-backup.lock 2>/dev/null; then
        log "ERROR" "Another backup process is running"
        exit 1
    fi
    
    trap 'rm -rf /tmp/estate-kit-backup.lock' EXIT
    
    # Run dependency checks
    if ! check_dependencies; then
        log "FATAL" "Dependency checks failed"
        exit 1
    fi
    
    # Create backup
    local backup_files
    if ! backup_files=$(create_backup); then
        log "FATAL" "Backup creation failed"
        exit 2
    fi
    
    # Upload to S3
    local backup_file=$(echo "${backup_files}" | cut -d: -f1)
    local metadata_file=$(echo "${backup_files}" | cut -d: -f2)
    
    if ! upload_to_s3 "${backup_file}" "${metadata_file}"; then
        log "FATAL" "Backup upload failed"
        exit 3
    fi
    
    # Cleanup old backups
    if ! cleanup_old_backups; then
        log "WARNING" "Backup cleanup encountered issues"
    fi
    
    log "INFO" "Backup process completed successfully"
}

# Execute main function
main