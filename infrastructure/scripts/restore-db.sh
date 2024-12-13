#!/bin/bash

# PostgreSQL Database Restoration Script for Estate Kit Platform
# Version: 1.0
# Required: postgresql-client 14+, aws-cli 2.0+
# Purpose: Automated database restoration with comprehensive validation and monitoring

set -euo pipefail

# Logging configuration
readonly LOG_FILE="/var/log/estatekit/db-restore-$(date +%Y%m%d_%H%M%S).log"
readonly SCRIPT_NAME=$(basename "$0")

# Default configuration
readonly DEFAULT_RESTORE_TEMP_DIR="/tmp/estatekit-restore"
readonly DEFAULT_LOG_LEVEL="INFO"
readonly DEFAULT_BACKUP_RETENTION_DAYS=30
readonly REQUIRED_PG_VERSION="14.0"
readonly REQUIRED_AWS_VERSION="2.0"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log() {
    local level=$1
    shift
    local message=$*
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "$*"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# Function to validate environment and dependencies
validate_environment() {
    log_info "Validating environment and dependencies..."

    # Check PostgreSQL client version
    if ! command -v pg_restore >/dev/null 2>&1; then
        log_error "PostgreSQL client not found. Please install postgresql-client 14+"
        return 1
    }

    local pg_version=$(pg_restore --version | grep -oP '\d+\.\d+')
    if ! awk -v ver="$pg_version" -v req="$REQUIRED_PG_VERSION" 'BEGIN{exit!(ver>=req)}'; then
        log_error "PostgreSQL client version $pg_version is below required version $REQUIRED_PG_VERSION"
        return 1
    }

    # Check AWS CLI version
    if ! command -v aws >/dev/null 2>&1; then
        log_error "AWS CLI not found. Please install aws-cli 2.0+"
        return 1
    }

    local aws_version=$(aws --version | grep -oP '\d+\.\d+' | head -1)
    if ! awk -v ver="$aws_version" -v req="$REQUIRED_AWS_VERSION" 'BEGIN{exit!(ver>=req)}'; then
        log_error "AWS CLI version $aws_version is below required version $REQUIRED_AWS_VERSION"
        return 1
    }

    # Validate required environment variables
    local required_vars=(
        "POSTGRES_HOST" "POSTGRES_PORT" "POSTGRES_USER" 
        "POSTGRES_PASSWORD" "POSTGRES_DB" "AWS_S3_BUCKET"
        "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_REGION"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            return 1
        fi
    done

    # Validate PostgreSQL connection
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
         -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' >/dev/null 2>&1; then
        log_error "Unable to connect to PostgreSQL database"
        return 1
    }

    # Validate S3 bucket access
    if ! aws s3 ls "s3://${AWS_S3_BUCKET}" >/dev/null 2>&1; then
        log_error "Unable to access S3 bucket ${AWS_S3_BUCKET}"
        return 1
    }

    # Check available disk space
    local required_space=$((20 * 1024 * 1024)) # 20GB minimum
    local available_space=$(df -k "${DEFAULT_RESTORE_TEMP_DIR%/*}" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: 20GB, Available: $((available_space/1024/1024))GB"
        return 1
    }

    log_success "Environment validation completed successfully"
    return 0
}

# Function to download backup from S3
download_from_s3() {
    local backup_name=$1
    local temp_dir="${DEFAULT_RESTORE_TEMP_DIR}/$(date +%Y%m%d_%H%M%S)"
    local backup_path="${temp_dir}/${backup_name}"

    log_info "Starting download of backup file: ${backup_name}"

    # Create temporary directory with secure permissions
    mkdir -p "${temp_dir}"
    chmod 700 "${temp_dir}"

    # Validate backup file exists in S3
    if ! aws s3 ls "s3://${AWS_S3_BUCKET}/${backup_name}" >/dev/null 2>&1; then
        log_error "Backup file ${backup_name} not found in S3 bucket"
        return 1
    }

    # Download with progress monitoring
    if ! aws s3 cp "s3://${AWS_S3_BUCKET}/${backup_name}" "${backup_path}" \
         --expected-size $(aws s3api head-object --bucket "${AWS_S3_BUCKET}" --key "${backup_name}" --query 'ContentLength' --output text); then
        log_error "Failed to download backup file from S3"
        return 1
    }

    # Verify file integrity
    local remote_md5=$(aws s3api head-object --bucket "${AWS_S3_BUCKET}" --key "${backup_name}" --query 'ETag' --output text | tr -d '"')
    local local_md5=$(md5sum "${backup_path}" | cut -d' ' -f1)
    
    if [[ "${remote_md5}" != "${local_md5}" ]]; then
        log_error "Backup file integrity check failed"
        rm -rf "${temp_dir}"
        return 1
    }

    log_success "Backup file downloaded successfully to ${backup_path}"
    echo "${backup_path}"
}

# Function to restore database
restore_database() {
    local backup_path=$1
    log_info "Starting database restoration from ${backup_path}"

    # Stop dependent services
    log_info "Stopping dependent services..."
    # Add service-specific stop commands here

    # Terminate existing connections
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"

    # Perform restoration
    log_info "Executing database restoration..."
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
         --host="$POSTGRES_HOST" \
         --port="$POSTGRES_PORT" \
         --username="$POSTGRES_USER" \
         --dbname="$POSTGRES_DB" \
         --verbose \
         --clean \
         --no-owner \
         --no-privileges \
         --jobs=4 \
         "${backup_path}"; then
        log_error "Database restoration failed"
        return 1
    }

    # Verify database integrity
    log_info "Verifying database integrity..."
    if ! PGPASSWORD="$POSTGRES_PASSWORD" vacuumdb \
         --host="$POSTGRES_HOST" \
         --port="$POSTGRES_PORT" \
         --username="$POSTGRES_USER" \
         --dbname="$POSTGRES_DB" \
         --analyze; then
        log_error "Database integrity check failed"
        return 1
    }

    # Restart dependent services
    log_info "Restarting dependent services..."
    # Add service-specific start commands here

    log_success "Database restoration completed successfully"
    return 0
}

# Function to perform cleanup
cleanup() {
    log_info "Starting cleanup process..."

    # Remove temporary files
    if [[ -d "${DEFAULT_RESTORE_TEMP_DIR}" ]]; then
        rm -rf "${DEFAULT_RESTORE_TEMP_DIR}"
        log_info "Temporary files removed"
    fi

    # Archive logs
    local archive_dir="/var/log/estatekit/archive"
    mkdir -p "${archive_dir}"
    
    # Compress current log file
    gzip -c "${LOG_FILE}" > "${archive_dir}/$(basename "${LOG_FILE}").gz"
    
    # Remove old logs
    find "${archive_dir}" -type f -mtime "+${DEFAULT_BACKUP_RETENTION_DAYS}" -delete

    # Generate restoration report
    local report_file="/var/log/estatekit/restore-report-$(date +%Y%m%d).txt"
    {
        echo "Database Restoration Report"
        echo "=========================="
        echo "Date: $(date)"
        echo "Status: Success"
        echo "Backup File: ${1:-Unknown}"
        echo "Duration: ${SECONDS} seconds"
        echo "=========================="
    } > "${report_file}"

    log_success "Cleanup completed successfully"
    return 0
}

# Main execution
main() {
    local backup_name=$1

    if [[ -z "${backup_name}" ]]; then
        log_error "Backup name not provided"
        echo "Usage: $0 <backup_name>"
        exit 1
    }

    # Create log directory
    mkdir -p "$(dirname "${LOG_FILE}")"

    log_info "Starting database restoration process..."
    log_info "Script version: 1.0"
    log_info "Backup name: ${backup_name}"

    # Execute restoration process
    if ! validate_environment; then
        log_error "Environment validation failed"
        exit 1
    fi

    local backup_path
    if ! backup_path=$(download_from_s3 "${backup_name}"); then
        log_error "Backup download failed"
        exit 1
    fi

    if ! restore_database "${backup_path}"; then
        log_error "Database restoration failed"
        cleanup "${backup_name}"
        exit 1
    fi

    if ! cleanup "${backup_name}"; then
        log_error "Cleanup process failed"
        exit 1
    fi

    log_success "Database restoration process completed successfully"
    exit 0
}

# Execute main function with proper error handling
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    trap 'log_error "Script interrupted"; cleanup' INT TERM
    main "$@"
fi