#!/bin/bash

# Estate Kit Monitoring Stack Setup Script
# Version: 1.0.0
# Purpose: Deploy and configure comprehensive monitoring stack with security and compliance features
# Dependencies: kubectl (latest), helm (3.x), aws-cli (2.x)

set -euo pipefail

# Global Constants
readonly NAMESPACE="estate-kit-monitoring"
readonly PROMETHEUS_VERSION="v2.45.0"
readonly GRAFANA_VERSION="9.5.0"
readonly ELASTIC_VERSION="8.9.0"
readonly JAEGER_VERSION="1.47.0"
readonly RETENTION_DAYS="90"
readonly BACKUP_BUCKET="estate-kit-monitoring-backup"
readonly LOG_FILE="/var/log/estate-kit/monitoring-setup.log"

# Security and Compliance Settings
declare -A SECURITY_CONTEXT=(
    ["runAsNonRoot"]="true"
    ["readOnlyRootFilesystem"]="true"
    ["runAsUser"]="65534"
    ["fsGroup"]="65534"
)

declare -A COMPLIANCE_SETTINGS=(
    ["data_encryption"]="true"
    ["audit_logging"]="true"
    ["backup_enabled"]="true"
    ["pipeda_compliance"]="true"
)

# Logging Function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Prerequisite Validation
validate_prerequisites() {
    log "INFO" "Validating prerequisites..."
    
    # Check required tools
    for tool in kubectl helm aws; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Validate Kubernetes connection
    if ! kubectl cluster-info &> /dev/null; then
        log "ERROR" "Cannot connect to Kubernetes cluster"
        exit 1
    }
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "Invalid AWS credentials"
        exit 1
    }
}

# Setup Prometheus with enhanced security
setup_prometheus() {
    local namespace="$1"
    local storage_class="$2"
    local retention_period="$3"
    local backup_bucket="$4"
    
    log "INFO" "Setting up Prometheus ${PROMETHEUS_VERSION}..."
    
    # Create namespace if not exists
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply RBAC policies
    kubectl apply -f ../kubernetes/monitoring/prometheus.yaml
    
    # Configure security context
    kubectl patch statefulset prometheus -n "$namespace" --type='json' -p="[
        {
            \"op\": \"add\",
            \"path\": \"/spec/template/spec/securityContext\",
            \"value\": ${SECURITY_CONTEXT[@]}
        }
    ]"
    
    # Setup backup cronjob
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: prometheus-backup
  namespace: $namespace
spec:
  schedule: "0 1 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli
            command: ["aws", "s3", "sync", "/prometheus", "s3://${backup_bucket}/prometheus"]
            volumeMounts:
            - name: prometheus-data
              mountPath: /prometheus
          restartPolicy: OnFailure
EOF
    
    log "INFO" "Prometheus setup completed"
}

# Setup Grafana with secure configuration
setup_grafana() {
    local namespace="$1"
    local admin_password="$2"
    local sso_config="$3"
    local backup_location="$4"
    
    log "INFO" "Setting up Grafana ${GRAFANA_VERSION}..."
    
    # Create secure secrets
    kubectl create secret generic grafana-credentials \
        --from-literal=admin-user=admin \
        --from-literal=admin-password="$admin_password" \
        --namespace "$namespace"
    
    # Apply Grafana configuration
    kubectl apply -f ../kubernetes/monitoring/grafana.yaml
    
    # Configure SSO if enabled
    if [[ -n "$sso_config" ]]; then
        kubectl patch deployment grafana -n "$namespace" --type='json' -p="$sso_config"
    fi
    
    # Setup automated backups
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: grafana-backup
  namespace: $namespace
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli
            command: ["aws", "s3", "sync", "/var/lib/grafana", "s3://${backup_location}/grafana"]
            volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
          restartPolicy: OnFailure
EOF
    
    log "INFO" "Grafana setup completed"
}

# Verify monitoring stack health
verify_monitoring() {
    local namespace="$1"
    local security_config="$2"
    
    log "INFO" "Verifying monitoring stack..."
    
    # Check component health
    local components=("prometheus" "grafana")
    for component in "${components[@]}"; do
        if ! kubectl get pods -n "$namespace" -l "app=$component" -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            log "ERROR" "$component is not running"
            return 1
        fi
    done
    
    # Verify security compliance
    if [[ "${COMPLIANCE_SETTINGS[pipeda_compliance]}" == "true" ]]; then
        # Verify encryption
        if ! kubectl get pods -n "$namespace" -o yaml | grep -q "securityContext"; then
            log "ERROR" "Security context not properly configured"
            return 1
        fi
    fi
    
    # Check backup status
    if [[ "${COMPLIANCE_SETTINGS[backup_enabled]}" == "true" ]]; then
        if ! aws s3 ls "s3://${BACKUP_BUCKET}" &> /dev/null; then
            log "ERROR" "Backup bucket not accessible"
            return 1
        fi
    fi
    
    log "INFO" "Monitoring stack verification completed successfully"
    return 0
}

# Main setup function
main() {
    log "INFO" "Starting monitoring stack setup..."
    
    # Validate prerequisites
    validate_prerequisites
    
    # Setup monitoring namespace
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Setup components
    setup_prometheus "$NAMESPACE" "gp2" "$RETENTION_DAYS" "$BACKUP_BUCKET"
    setup_grafana "$NAMESPACE" "${GRAFANA_ADMIN_PASSWORD:-admin}" "$SSO_CONFIG" "$BACKUP_BUCKET"
    
    # Verify setup
    if verify_monitoring "$NAMESPACE" "${SECURITY_CONTEXT[@]}"; then
        log "INFO" "Monitoring stack setup completed successfully"
    else
        log "ERROR" "Monitoring stack setup failed"
        exit 1
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi