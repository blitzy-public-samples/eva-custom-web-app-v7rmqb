#!/bin/bash

# Estate Kit - Monitoring Setup Script
# Version: 1.0.0
#
# Requirements Addressed:
# - Monitoring & Observability (Technical Specifications/2.7 Cross-Cutting Concerns/Monitoring & Observability)
#   Ensures that system metrics are collected, monitored, and visualized for performance and reliability.
# - Resource Utilization Tracking (Technical Specifications/2.5 Deployment Architecture)
#   Tracks resource utilization across the Kubernetes cluster to optimize performance and scaling.
# - Traffic Routing (Technical Specifications/2.5 Deployment Architecture)
#   Ensures that HTTP/HTTPS traffic is routed to the appropriate frontend and backend services.

# Human Tasks:
# 1. Verify network policies allow Prometheus to scrape metrics from all required targets
# 2. Configure persistent storage for Prometheus data retention if needed
# 3. Review and adjust resource limits based on cluster capacity
# 4. Set up alerting rules in Prometheus configuration
# 5. Configure proper backup procedures for Prometheus data
# 6. Verify RBAC permissions for Prometheus service account

# Exit on any error
set -e

# Global variables
MONITORING_NAMESPACE="estate-kit-monitoring"
PROMETHEUS_DEPLOYMENT="prometheus-deployment"
GRAFANA_DEPLOYMENT="grafana-deployment"

# Function to check if kubectl is installed
check_prerequisites() {
    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl is not installed"
        exit 1
    }
    echo "Prerequisites check passed"
}

# Function to create monitoring namespace
setup_namespace() {
    echo "Creating monitoring namespace..."
    kubectl create namespace ${MONITORING_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    echo "Namespace ${MONITORING_NAMESPACE} created/configured successfully"
}

# Function to setup Prometheus
setup_prometheus() {
    echo "Setting up Prometheus..."
    
    # Apply ConfigMap for Prometheus
    kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n ${MONITORING_NAMESPACE}
    
    # Apply Prometheus RBAC and deployment
    kubectl apply -f infrastructure/kubernetes/monitoring/prometheus.yaml -n ${MONITORING_NAMESPACE}
    
    # Wait for Prometheus deployment
    echo "Waiting for Prometheus deployment to be ready..."
    kubectl rollout status deployment/${PROMETHEUS_DEPLOYMENT} -n ${MONITORING_NAMESPACE} --timeout=300s
    
    echo "Prometheus setup completed successfully"
}

# Function to setup Grafana
setup_grafana() {
    echo "Setting up Grafana..."
    
    # Apply ConfigMap for Grafana
    kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n ${MONITORING_NAMESPACE}
    
    # Apply Grafana deployment
    kubectl apply -f infrastructure/kubernetes/monitoring/grafana.yaml -n ${MONITORING_NAMESPACE}
    
    # Wait for Grafana deployment
    echo "Waiting for Grafana deployment to be ready..."
    kubectl rollout status deployment/${GRAFANA_DEPLOYMENT} -n ${MONITORING_NAMESPACE} --timeout=300s
    
    echo "Grafana setup completed successfully"
}

# Function to configure ingress
configure_ingress() {
    echo "Configuring ingress for monitoring tools..."
    
    # Apply ingress configuration
    kubectl apply -f infrastructure/kubernetes/ingress/nginx.yaml -n ${MONITORING_NAMESPACE}
    
    echo "Ingress configuration completed successfully"
}

# Function to verify monitoring setup
verify_setup() {
    echo "Verifying monitoring setup..."
    
    # Check Prometheus pods
    PROMETHEUS_PODS=$(kubectl get pods -n ${MONITORING_NAMESPACE} -l app=prometheus -o jsonpath='{.items[*].status.phase}')
    if [[ ! $PROMETHEUS_PODS =~ ^(Running\ )*Running$ ]]; then
        echo "Error: Prometheus pods are not running correctly"
        exit 1
    fi
    
    # Check Grafana pods
    GRAFANA_PODS=$(kubectl get pods -n ${MONITORING_NAMESPACE} -l app=grafana -o jsonpath='{.items[*].status.phase}')
    if [[ ! $GRAFANA_PODS =~ ^(Running\ )*Running$ ]]; then
        echo "Error: Grafana pods are not running correctly"
        exit 1
    }
    
    echo "Monitoring setup verification completed successfully"
}

# Main execution
main() {
    echo "Starting monitoring setup..."
    
    # Run setup steps
    check_prerequisites
    setup_namespace
    setup_prometheus
    setup_grafana
    configure_ingress
    verify_setup
    
    echo "Monitoring setup completed successfully"
    echo "Prometheus UI: https://prometheus.estatekit.com"
    echo "Grafana UI: https://grafana.estatekit.com"
}

# Execute main function
main

```

This script:

1. Implements all required functionality from the JSON specification
2. Uses the correct relative paths for importing Kubernetes resources
3. Follows proper shell scripting practices with error handling
4. Includes verification steps for the setup
5. Provides clear logging and status messages
6. Implements proper namespace handling
7. Configures both Prometheus and Grafana
8. Sets up ingress for external access
9. Includes proper documentation and requirement tracing
10. Lists human tasks that need attention

The script can be executed with:
```bash
chmod +x infrastructure/scripts/setup-monitoring.sh
./infrastructure/scripts/setup-monitoring.sh