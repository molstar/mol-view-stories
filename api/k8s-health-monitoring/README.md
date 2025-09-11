# MolViewStories Health Monitoring System

Automated Kubernetes-based health monitoring for Development and Production APIs with email alerts on status changes.

## Prerequisites

### 1. CERIT-SC Kubernetes Access
- **Access Required**: CERIT-SC Kubernetes platform
- **Documentation**: https://docs.cerit.io/en/docs/platform/overview
- **Namespace**: `mol-view-stories-ns`
- **Tools**: `kubectl` configured for CERIT-SC cluster

### 2. Access to the `mol-view-stories-ns` namespace
  - Let [TerkaSlan](https://github.com/TerkaSlan) know if you need it

## Email Setup

### Gmail Configuration
1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Enable

2. **Generate App Password**
   - Google Account → Security → App passwords
   - Select app: "Mail", device: "Other (Custom name)"
   - Copy the 16-character password (remove spaces)

3. **Create Kubernetes Secret**
```bash
kubectl create secret generic health-monitor-smtp \
  --from-literal=smtp_username='your-email@gmail.com' \
  --from-literal=smtp_password='your-16-char-app-password' \
  --from-literal=alert_to='recipient@example.com' \
  -n mol-view-stories-ns
```

**Note**: Replace with your actual Gmail address and the generated app password.

## System Architecture

### How It Works
1. **CronJob** runs every 5 minutes in Kubernetes
2. **Monitor Script** checks both Development and Production APIs via port-forwarding
3. **Health Status** stored in ConfigMap for persistence
4. **Email Alerts** sent only when status changes (healthy ↔ unhealthy)

### Monitored Endpoints
| Environment | Internal Service | External URL | Health Check |
|-------------|------------------|--------------|--------------|
| **Development** | `mol-view-stories-api-svc-dev` | https://mol-view-stories-dev.dyn.cloud.e-infra.cz | `/health` |
| **Production** | `mol-view-stories-api-svc` | https://mol-view-stories.dyn.cloud.e-infra.cz | `/health` |
| **Production Alias** | - | https://stories.molstar.org | `/health` |

## Deployment

### Automated Deployment (Recommended)
```bash
cd k8s-health-monitoring
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment
If you prefer step-by-step deployment:

#### Step 1: Apply RBAC Resources
```bash
kubectl apply -f rbac.yaml -n mol-view-stories-ns
```
Creates:
- ServiceAccount: `health-monitor`
- Role: `health-monitor-role` (configmap access, service discovery, port-forwarding)
- RoleBinding: `health-monitor-binding`

#### Step 2: Create Health Status Storage
```bash
kubectl apply -f health-reporter.yaml -n mol-view-stories-ns
```
Creates ConfigMap `api-health-status` to store current health state.

#### Step 3: Deploy Monitoring Script
```bash
kubectl create configmap health-monitor-script-data \
  --from-file=monitor.sh=monitor.sh \
  -n mol-view-stories-ns
```

#### Step 4: Deploy CronJob
```bash
kubectl apply -f cronjob.yaml -n mol-view-stories-ns
```
Creates CronJob `health-monitor` that runs every 5 minutes.

## Monitoring Script (`monitor.sh`)

### Core Functions
- **API Health Check**: Port-forwards to services and calls `/health` endpoint
- **Status Parsing**: Extracts API and MinIO health from JSON response
- **Change Detection**: Compares current vs previous health status
- **Email Alerts**: Sends notifications only on status changes
- **Logging**: Clean output for Kubernetes logs

### Manual Execution
```bash
# Test the monitoring script directly
kubectl create job --from=cronjob/health-monitor manual-health-check -n mol-view-stories-ns
kubectl logs job/manual-health-check -n mol-view-stories-ns -f
```

### Email Testing
```bash
# Test email functionality
kubectl set env cronjob/health-monitor TEST_EMAIL=true -n mol-view-stories-ns
kubectl create job --from=cronjob/health-monitor test-email -n mol-view-stories-ns
kubectl logs job/test-email -n mol-view-stories-ns -f

# Remove test flag
kubectl set env cronjob/health-monitor TEST_EMAIL- -n mol-view-stories-ns
```

## Testing Scripts

```bash
cd test
```

### Test Failure Scenario
```bash
chmod +x test-failure.sh
./test-failure.sh
```
Simulates API failures and triggers alert email.

### Test Recovery Scenario
```bash
chmod +x test-recovery.sh
./test-recovery.sh
```
Simulates recovery and triggers recovery email.

### Restore Normal Operation
```bash
chmod +x restore-normal.sh
./restore-normal.sh
```
Returns to normal monitoring after testing.

## Configuration

### Schedule Modification
Edit `cronjob.yaml` and reapply:
```yaml
spec:
  schedule: "*/5 * * * *"  # Every 5 minutes (default)
  # schedule: "*/10 * * *"  # Every 10 minutes
  # schedule: "0 */1 * * *"  # Every hour
  # schedule: "0 9 * * *"    # Daily at 9 AM
```

### Resource Limits
Current settings (in `cronjob.yaml`):
```yaml
resources:
  requests:
    memory: "32Mi"
    cpu: "50m"
  limits:
    memory: "64Mi"
    cpu: "100m"
```

## Monitoring and Troubleshooting

### Check System Status
```bash
# View CronJob status
kubectl get cronjob health-monitor -n mol-view-stories-ns

# View recent jobs
kubectl get jobs -l app=health-monitor -n mol-view-stories-ns

# View current health status
kubectl get configmap api-health-status -o jsonpath='{.data.status\.json}' -n mol-view-stories-ns | jq
```

### View Logs
```bash
# Recent logs from all health monitor jobs
kubectl logs -l app=health-monitor -n mol-view-stories-ns --tail=50

# Follow logs from specific job
kubectl logs job/JOBNAME -n mol-view-stories-ns -f
```