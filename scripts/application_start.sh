#!/bin/bash
# Configuration
PROJECT_DIR="/home/ubuntu/aws-new"

echo "Current Directory: $PROJECT_DIR"
cd $PROJECT_DIR

# 1. Pull latest code from GitHub
echo "Syncing with GitHub..."
git fetch origin master
git reset --hard origin/master || echo "Git sync failed, using current files."

# 2. Update Backend
cd Backend
if [ ! -f .env ]; then
    echo "⚠️ WARNING: .env file missing in Backend directory!"
    echo "Creating a dummy .env for initial startup if possible..."
fi

echo "Installing backend dependencies..."
npm install --omit=dev

# 3. Restart Application
echo "Restarting PM2 process..."
pm2 restart stellar-backend || pm2 start src/index.js --name "stellar-backend"

# 4. Save state
pm2 save
echo "Backend deployment complete!"
