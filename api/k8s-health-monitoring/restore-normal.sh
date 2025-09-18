#!/bin/bash
set -e

echo "Restoring Normal Health Monitoring..."
echo "This will restore the original monitoring script."

NAMESPACE="mol-view-stories-ns"

echo "Restoring original monitoring script..."
# Delete existing ConfigMap if it exists (ignore errors if not found)
kubectl delete configmap health-monitor-script-data -n "$NAMESPACE" 2>/dev/null || echo "ConfigMap not found (this is okay)"

# Find the monitor.sh script - check parent directory if not in current directory
SCRIPT_PATH=""
if [ -f "monitor.sh" ]; then
    SCRIPT_PATH="monitor.sh"
elif [ -f "../monitor.sh" ]; then
    SCRIPT_PATH="../monitor.sh"
elif [ -f "k8s-health-monitoring/monitor.sh" ]; then
    SCRIPT_PATH="k8s-health-monitoring/monitor.sh"
else
    echo "Error: Cannot find monitor.sh script. Please run from k8s-health-monitoring directory or its test subdirectory."
    exit 1
fi

echo "Using monitor.sh from: $SCRIPT_PATH"
kubectl create configmap health-monitor-script-data \
    --from-file=monitor.sh="$SCRIPT_PATH" \
    -n "$NAMESPACE"

echo "Normal monitoring restored!"
echo ""
echo "The system will now:"
echo "   • Monitor real API health every 5 minutes via CronJob"
echo "   • Send emails only on actual status changes"
echo "   • Use clean logs and proper email formatting"
echo ""
echo "To check the CronJob:"
echo "   kubectl get cronjob health-monitor -n $NAMESPACE"
echo ""
echo "To view recent logs:"
echo "   kubectl logs -l app=health-monitor -n $NAMESPACE --tail=50"