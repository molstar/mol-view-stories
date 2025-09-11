#!/bin/bash
set -e

echo "Deploying MolViewStories Health Monitoring System..."

NAMESPACE="mol-view-stories-ns"

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo "Namespace $NAMESPACE does not exist. Please create it first."
    exit 1
fi

# Step 1: Apply RBAC
echo "Step 1: Applying RBAC configuration..."
kubectl apply -f rbac.yaml

# Step 2: Apply health status ConfigMap (if not exists)
echo "Step 2: Ensuring health status ConfigMap exists..."
if ! kubectl get configmap api-health-status -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl apply -f health-reporter.yaml
    echo "Created health status ConfigMap"
else
    echo "Health status ConfigMap already exists"
fi

# Step 3: Create monitoring script ConfigMap
echo "Step 3: Creating monitoring script ConfigMap..."
kubectl delete configmap health-monitor-script-data -n "$NAMESPACE" 2>/dev/null || true
kubectl create configmap health-monitor-script-data \
    --from-file=monitor.sh=monitor.sh \
    -n "$NAMESPACE"

# Step 4: Apply CronJob
echo "Step 4: Applying CronJob configuration..."
kubectl apply -f cronjob.yaml

# Step 5: Check deployment status
echo "Step 5: Checking deployment status..."
kubectl get cronjob health-monitor -n "$NAMESPACE"
kubectl get configmap api-health-status health-monitor-script-data -n "$NAMESPACE"

echo ""
echo "Health monitoring system deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure SMTP secret for email alerts:"
echo "   kubectl create secret generic health-monitor-smtp \\"
echo "     --from-literal=smtp_username='your-email@gmail.com' \\"
echo "     --from-literal=smtp_password='your-app-password' \\"
echo "     --from-literal=alert_to='your-email@gmail.com' \\"
echo "     -n $NAMESPACE"
echo ""
echo "2. Test the system:"
echo "   kubectl create job --from=cronjob/health-monitor test-health-monitor -n $NAMESPACE"
echo "   kubectl logs job/test-health-monitor -n $NAMESPACE -f"
echo ""
echo "3. Monitor the CronJob (runs every 5 minutes):"
echo "   kubectl get jobs -n $NAMESPACE"
echo "   kubectl logs -l app=health-monitor -n $NAMESPACE --tail=50"