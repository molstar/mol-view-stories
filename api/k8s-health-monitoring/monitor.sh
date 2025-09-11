#!/bin/bash
set -e

# Configuration - monitoring both dev and prod APIs
DEV_SERVICE="mol-view-stories-api-svc-dev"
PROD_SERVICE="mol-view-stories-api-svc"
NAMESPACE="mol-view-stories-ns" 
HEALTH_CONFIG_MAP="api-health-status"

echo "Health check starting... ($(date -u +"%H:%M:%S"))"

# Test email functionality if requested
if [ "${TEST_EMAIL:-false}" = "true" ]; then
    echo "Testing email functionality..."
    send_alert "Email Test - MolViewStories" "This is a test email to verify SMTP configuration is working. Time: $(date)"
    echo "Test email sent (if SMTP is configured)"
    exit 0
fi

# Execute commands safely
safe_exec() {
    local cmd="$1"
    local result
    if result=$(eval "$cmd" 2>&1); then
        echo "$result"
        return 0
    else
        echo "Error executing: $cmd" >&2
        echo "$result" >&2
        return 1
    fi
}

# API health check - returns "api_name:status:minio_status" 
check_api_health() {
    local service_name="$1"
    local api_name="$2"
    
    echo "Checking $api_name API..." >&2
    
    # Check if service exists
    if ! kubectl get service "$service_name" -n "$NAMESPACE" >/dev/null 2>&1; then
        echo "$api_name: Service not found" >&2
        echo "$api_name:service_not_found:unknown"
        return 1
    fi
    
    # Start port forward silently
    kubectl port-forward "service/$service_name" --address=127.0.0.1 8888:5000 -n "$NAMESPACE" >/dev/null 2>&1 &
    local PF_PID=$!
    
    # Wait for port forward to be ready (max 10 seconds)
    local ready=false
    for i in $(seq 1 10); do
        sleep 1
        if nc -z 127.0.0.1 8888 2>/dev/null; then
            ready=true
            break
        fi
    done
    
    if [ "$ready" = false ]; then
        echo "$api_name: Port forward timeout" >&2
        kill $PF_PID 2>/dev/null || true
        echo "$api_name:port_forward_timeout:unknown"
        return 1
    fi
    
    # Make health check request
    local response
    if response=$(wget -q -O - --timeout=5 "http://127.0.0.1:8888/health" 2>/dev/null); then
        # Parse JSON response for status and minio status
        local api_status minio_status
        api_status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        minio_status=$(echo "$response" | grep -o '"minio":{[^}]*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3 || echo "unknown")
        
        echo "$api_name: $api_status" >&2
        echo "$api_name:$api_status:$minio_status"
    else
        echo "$api_name: Health check failed" >&2
        echo "$api_name:request_failed:unknown"
    fi
    
    # Cleanup
    kill $PF_PID 2>/dev/null || true
    return 0
}

# Send email alert on status changes
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

# Main health check - check both dev and prod APIs
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Check both APIs and capture only stdout
DEV_RESPONSE=$(check_api_health "$DEV_SERVICE" "dev" 2>/dev/null | grep "^dev:")
PROD_RESPONSE=$(check_api_health "$PROD_SERVICE" "prod" 2>/dev/null | grep "^prod:")


# Parse responses safely
if [ -n "$DEV_RESPONSE" ]; then
    DEV_STATUS=$(echo "$DEV_RESPONSE" | cut -d':' -f2)
    DEV_MINIO=$(echo "$DEV_RESPONSE" | cut -d':' -f3)
else
    DEV_STATUS="unknown"
    DEV_MINIO="unknown"
fi

if [ -n "$PROD_RESPONSE" ]; then
    PROD_STATUS=$(echo "$PROD_RESPONSE" | cut -d':' -f2)
    PROD_MINIO=$(echo "$PROD_RESPONSE" | cut -d':' -f3)
else
    PROD_STATUS="unknown"
    PROD_MINIO="unknown"
fi

# Overall system health
if [ "$DEV_STATUS" = "healthy" ] && [ "$PROD_STATUS" = "healthy" ]; then
    SYSTEM_HEALTHY=true
    echo "Both APIs operational"
else
    SYSTEM_HEALTHY=false
    echo "Issues detected - Dev: $DEV_STATUS, Prod: $PROD_STATUS"
fi

# Get previous overall status for alerting
PREV_HEALTHY=$(kubectl get configmap $HEALTH_CONFIG_MAP -o jsonpath='{.data.status\.json}' 2>/dev/null | grep -o '"healthy":[^,}]*' | cut -d: -f2 | tr -d ' "' || echo "true")

# Update ConfigMap with current status
NEW_STATUS=$(cat << EOF
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
EOF
)

if kubectl patch configmap "$HEALTH_CONFIG_MAP" --type merge \
    -p "{\"data\":{\"status.json\":\"$(echo "$NEW_STATUS" | tr -d '\n' | sed 's/"/\\"/g')\"}}"; then
    echo "Status updated"
else
    echo "Failed to update ConfigMap"
    exit 1
fi

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
        echo "Sending recovery email"
        send_alert "MolViewStories APIs Recovered" "$RECOVERY_MSG"
    else
        # Build specific subject line
        SUBJECT_PARTS=""
        [ "$DEV_STATUS" != "healthy" ] && SUBJECT_PARTS="$SUBJECT_PARTS Dev API DOWN"
        [ "$PROD_STATUS" != "healthy" ] && SUBJECT_PARTS="$SUBJECT_PARTS Prod API DOWN"
        
        # Clean up spacing and add separators
        SUBJECT_PARTS=$(echo "$SUBJECT_PARTS" | sed 's/^ *//' | sed 's/ Dev API DOWN Prod API DOWN/ Dev API DOWN | Prod API DOWN/')
        [ -z "$SUBJECT_PARTS" ] && SUBJECT_PARTS="Unknown API DOWN"
        
        echo "Sending alert email for: $SUBJECT_PARTS"
        DEV_ICON=$([ "$DEV_STATUS" = "healthy" ] && echo "🟢" || echo "🔴")
        PROD_ICON=$([ "$PROD_STATUS" = "healthy" ] && echo "🟢" || echo "🔴")
        
        # Format status with proper capitalization
        DEV_STATUS_DISPLAY=$(echo "$DEV_STATUS" | sed 's/^u/U/' | sed 's/^h/H/' | sed 's/^f/F/' | sed 's/^r/R/')
        PROD_STATUS_DISPLAY=$(echo "$PROD_STATUS" | sed 's/^u/U/' | sed 's/^h/H/' | sed 's/^f/F/' | sed 's/^r/R/')
        
        ALERT_MSG="API health check detected issues:

$DEV_ICON Development API: https://mol-view-stories-dev.dyn.cloud.e-infra.cz/health
   Status: $DEV_STATUS_DISPLAY

$PROD_ICON Production API: https://mol-view-stories.dyn.cloud.e-infra.cz/health (https://stories.molstar.org/health)
   Status: $PROD_STATUS_DISPLAY

Checked at: $CURRENT_TIME

Please investigate immediately."
        send_alert "MolViewStories $SUBJECT_PARTS" "$ALERT_MSG"
    fi
else
    echo "No status change - no email needed"
fi

echo "Check complete: $([ "$SYSTEM_HEALTHY" = "true" ] && echo "All systems operational" || echo "Issues detected") ($(date -u +"%H:%M:%S"))"