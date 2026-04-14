#!/bin/bash
# Configuration
PROJECT_DIR="/home/ubuntu/aws-new"
LOG_FILE="/var/log/deploy-debug.log"

# Function to log both to console and file
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "--- DEPLOYMENT STARTED ---"
log "Current Directory: $(pwd)"
log "Target Directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    log "❌ ERROR: Project directory $PROJECT_DIR does not exist!"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 1. Sync with GitHub
log "Syncing with GitHub (resetting to master)..."
git fetch origin master
git reset --hard origin/master >> "$LOG_FILE" 2>&1

# 2. Update Backend
cd Backend || exit 1
log "Installing backend dependencies in $(pwd)..."
npm install --omit=dev >> "$LOG_FILE" 2>&1

# 3. Restart Application
log "Restarting PM2 process 'stellar-backend'..."
pm2 restart stellar-backend >> "$LOG_FILE" 2>&1 || pm2 start src/index.js --name "stellar-backend" >> "$LOG_FILE" 2>&1

# 4. Status Check
log "PM2 Status after restart:"
pm2 list >> "$LOG_FILE" 2>&1
pm2 list

log "--- DEPLOYMENT COMPLETE ---"
