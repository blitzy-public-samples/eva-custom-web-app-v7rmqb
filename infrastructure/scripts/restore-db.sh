#!/bin/bash

# Human Tasks:
# 1. Ensure AWS CLI v2.0 is installed and configured with appropriate credentials
# 2. Verify PostgreSQL client tools (pg_restore) v14.0 are installed
# 3. Configure AWS IAM permissions for S3 bucket access
# 4. Ensure network connectivity to RDS instance is properly configured
# 5. Verify Kubernetes secret 'database-credentials' exists and contains required values

# Set strict error handling
set -euo pipefail

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    local line_number=$1
    local error_code=$2
    log "ERROR: Command failed at line ${line_number} with exit code ${error_code}"
    exit "${error_code}"
}

# Set error trap
trap 'handle_error ${LINENO} $?' ERR

# Function to validate environment variables
validate_env_vars() {
    local required_vars=("DB_USER" "DB_PASSWORD" "DB_HOST" "DB_PORT" "S3_BUCKET_NAME")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR: Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
}

# Function to retrieve latest backup file from S3
get_latest_backup() {
    local latest_backup
    # Addresses requirement: Database Restoration Automation
    # Technical Specifications/2.7 Cross-Cutting Concerns/Disaster Recovery
    latest_backup=$(aws s3 ls "s3://${S3_BUCKET_NAME}/backups/" | sort | tail -n 1 | awk '{print $4}')
    if [[ -z "$latest_backup" ]]; then
        log "ERROR: No backup files found in S3 bucket"
        exit 1
    }
    echo "$latest_backup"
}

# Function to restore database
restore_database() {
    local backup_file=$1
    local temp_dir="/tmp/estatekit_restore"
    local backup_path="${temp_dir}/${backup_file}"

    # Create temporary directory
    mkdir -p "$temp_dir"

    # Download backup file from S3
    # Addresses requirement: Data Security
    # Technical Specifications/1.3 Scope/In-Scope/Data Security
    log "Downloading backup file from S3..."
    aws s3 cp "s3://${S3_BUCKET_NAME}/backups/${backup_file}" "$backup_path" \
        --sse AES256

    # Verify backup file exists and is not empty
    if [[ ! -s "$backup_path" ]]; then
        log "ERROR: Failed to download backup file or file is empty"
        rm -rf "$temp_dir"
        exit 1
    }

    # Restore database using pg_restore
    # Addresses requirement: Database Restoration Automation
    # Technical Specifications/2.7 Cross-Cutting Concerns/Disaster Recovery
    log "Starting database restoration..."
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="estatekit" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        "$backup_path"

    # Clean up temporary files
    log "Cleaning up temporary files..."
    rm -rf "$temp_dir"

    log "Database restoration completed successfully"
    return 0
}

# Main execution
main() {
    log "Starting database restoration process..."

    # Validate environment variables
    validate_env_vars

    # Get latest backup file
    local backup_file
    backup_file=$(get_latest_backup)
    log "Found latest backup file: ${backup_file}"

    # Perform database restoration
    restore_database "$backup_file"
}

# Execute main function
main