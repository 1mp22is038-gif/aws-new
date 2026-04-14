#!/bin/bash
# Configuration
PROJECT_DIR="/home/ubuntu/aws-new"
LOG_FILE="/home/ubuntu/deploy-debug.log"

# Function to log both to console and file
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "--- DEPLOYMENT STARTED ---"
cd "$PROJECT_DIR" || { log "❌ ERROR: Cannot cd to $PROJECT_DIR"; exit 1; }

# 1. Sync with GitHub
log "Syncing with GitHub (forcing reset to origin/master)..."
git fetch origin master
git reset --hard origin/master >> "$LOG_FILE" 2>&1

# 2. Update Backend
cd Backend || exit 1
log "Ensuring .env file exists..."
if [ ! -f .env ]; then
    log "⚠️ .env missing! Recreating with primary DB credentials..."
    cat <<EOT > .env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://app_user:StrongAppPass123@10.0.172.144:5432/app_db"
JWT_SECRET="super-secret-key-1234"
FRONTEND_URL="*"
EOT
fi

log "Installing backend dependencies in $(pwd)..."
npm install --omit=dev >> "$LOG_FILE" 2>&1

# 3. Restart Application
log "Restarting PM2 process 'stellar-backend'..."
pm2 delete stellar-backend >> "$LOG_FILE" 2>&1
pm2 start src/index.js --name "stellar-backend" >> "$LOG_FILE" 2>&1
pm2 save

# 4. Final Status Check
log "Waiting 5 seconds for startup..."
sleep 5
log "Local Health Check (port 5000):"
curl -s http://localhost:5000/health || log "❌ Local health check FAILED!"

log "PM2 Status:"
pm2 list >> "$LOG_FILE" 2>&1
pm2 list

log "--- DEPLOYMENT COMPLETE ---"
