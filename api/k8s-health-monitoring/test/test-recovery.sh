#!/bin/bash
set -e

echo "🧪 Testing Recovery Email Scenario..."
echo "This will simulate API recovery and send a recovery email."

NAMESPACE="mol-view-stories-ns"

# Step 1: Set ConfigMap to unhealthy state first (to ensure status change detection works)
echo "📊 Step 1: Setting ConfigMap to unhealthy state..."
kubectl patch configmap api-health-status -n "$NAMESPACE" --type merge \
    -p '{"data":{"status.json":"{\"healthy\":false,\"lastCheck\":\"2024-01-01T00:00:00Z\"}"}}'
echo "✅ ConfigMap set to unhealthy"

# Step 2: Create recovery test script
echo "📝 Step 2: Creating recovery test script..."
cat > /tmp/monitor-recovery-test.sh << 'EOF'
#!/bin/bash
set -e

# Configuration - monitoring both dev and prod APIs
DEV_SERVICE="mol-view-stories-api-svc-dev"
PROD_SERVICE="mol-view-stories-api-svc"
NAMESPACE="mol-view-stories-ns" 
HEALTH_CONFIG_MAP="api-health-status"

echo "🔍 Health check starting... ($(date -u +"%H:%M:%S"))"

# 🧪 TEST MODE: Force API recovery simulation
echo "🧪 TEST MODE: Simulating API recovery..."

# Simulate both APIs healthy
DEV_STATUS="healthy"
DEV_MINIO="healthy"
PROD_STATUS="healthy"
PROD_MINIO="healthy"

echo "🔍 Checking dev API..."
echo "✅ dev: healthy"
echo "🔍 Checking prod API..."
echo "✅ prod: healthy"

# Overall system health (both APIs must be healthy)
if [ "$DEV_STATUS" = "healthy" ] && [ "$PROD_STATUS" = "healthy" ]; then
    SYSTEM_HEALTHY=true
    echo "✅ Both APIs operational"
else
    SYSTEM_HEALTHY=false
    echo "❌ Issues detected - Dev: $DEV_STATUS, Prod: $PROD_STATUS"
fi

# Get previous overall status for alerting
PREV_HEALTHY=$(kubectl get configmap $HEALTH_CONFIG_MAP -o jsonpath='{.data.status\.json}' 2>/dev/null | grep -o '"healthy":[^,}]*' | cut -d: -f2 | tr -d ' "' || echo "true")

# Update ConfigMap with current status
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NEW_STATUS=$(cat << EOD
{
  "healthy": $SYSTEM_HEALTHY,
  "lastCheck": "$CURRENT_TIME",
  "dev": {
    "status": "$DEV_STATUS"
  },
  "prod": {
    "status": "$PROD_STATUS",
    "minio": "$PROD_MINIO"
  }
}
EOD
)

if kubectl patch configmap "$HEALTH_CONFIG_MAP" --type merge \
    -p "{\"data\":{\"status.json\":\"$(echo "$NEW_STATUS" | tr -d '\n' | sed 's/"/\\"/g')\"}}"; then
    echo "📊 Status updated"
else
    echo "❌ Failed to update ConfigMap"
    exit 1
fi

# Send email alert function
send_alert() {
    local subject="$1"
    local body="$2"
    
    # Skip if no SMTP secret configured
    if ! kubectl get secret health-monitor-smtp -n "$NAMESPACE" >/dev/null 2>&1; then
        echo "No SMTP secret configured, skipping email"
        return
    fi
    
    echo "SMTP secret found, sending email..."
    
    SMTP_USER=$(kubectl get secret health-monitor-smtp -n "$NAMESPACE" -o jsonpath="{.data.smtp_username}" | base64 -d)
    SMTP_PASS=$(kubectl get secret health-monitor-smtp -n "$NAMESPACE" -o jsonpath="{.data.smtp_password}" | base64 -d)
    ALERT_TO=$(kubectl get secret health-monitor-smtp -n "$NAMESPACE" -o jsonpath="{.data.alert_to}" | base64 -d)
    
    echo "Email config - From: $SMTP_USER, To: $ALERT_TO"
    
    # Send email
    curl --silent --max-time 10 \
         --url "smtps://smtp.gmail.com:465" \
         --ssl-reqd --user "$SMTP_USER:$SMTP_PASS" \
         --mail-from "$SMTP_USER" --mail-rcpt "$ALERT_TO" \
         -T <(echo -e "Subject: $subject\n\n$body") \
         || echo "Email send failed"
}

# Send alerts only on status changes
if [ "$PREV_HEALTHY" != "$SYSTEM_HEALTHY" ]; then
    if [ "$SYSTEM_HEALTHY" = "true" ]; then
        # Recovery email
        RECOVERY_MSG="All APIs are now healthy:

🟢 Development API: https://mol-view-stories-dev.dyn.cloud.e-infra.cz/health
   Status: Healthy

🟢 Production API: https://mol-view-stories.dyn.cloud.e-infra.cz/health (https://stories.molstar.org/health)
   Status: Healthy

Checked at: $CURRENT_TIME"
        echo "📧 Sending recovery email"
        send_alert "MolViewStories APIs Recovered" "$RECOVERY_MSG"
    else
        echo "📧 Would send alert email (but system is unhealthy)"
    fi
else
    echo "✉️ No status change - no email needed"
fi

echo "🏁 Check complete: $([ "$SYSTEM_HEALTHY" = "true" ] && echo "All systems operational" || echo "Issues detected") ($(date -u +"%H:%M:%S"))"
EOF

# Step 3: Deploy test script and run
echo "🚀 Step 3: Deploying and running recovery test..."
kubectl delete configmap health-monitor-script-data -n "$NAMESPACE"
kubectl create configmap health-monitor-script-data \
    --from-file=monitor.sh=/tmp/monitor-recovery-test.sh \
    -n "$NAMESPACE"

kubectl create job --from=cronjob/health-monitor test-recovery-email -n "$NAMESPACE"

echo ""
echo "⏳ Waiting for test to complete..."
kubectl wait --for=condition=complete job/test-recovery-email -n "$NAMESPACE" --timeout=60s

echo ""
echo "📋 Test Results:"
kubectl logs job/test-recovery-email -n "$NAMESPACE"

echo ""
echo "🧹 Cleaning up test job..."
kubectl delete job test-recovery-email -n "$NAMESPACE"

echo ""
echo "✅ Recovery email test complete!"
echo "📧 Check your email for the recovery message."

# Clean up temp file
rm -f /tmp/monitor-recovery-test.sh