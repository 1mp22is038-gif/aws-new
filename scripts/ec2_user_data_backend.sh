#!/bin/bash
# Redirect all output to a log file for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting EC2 User Data script for Backend..."

# 1. Update system and install required system dependencies
apt-get update -y
apt-get install -y git curl build-essential ruby-full wget

# 1.5 Install AWS CodeDeploy Agent
cd /home/ubuntu
wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
chmod +x ./install
./install auto
service codedeploy-agent start

# 2. Install Node.js 18 (matches the version in before_install.sh)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. Install PM2 globally
npm install -g pm2

# 4. Clone the repository and set up the application as the 'ubuntu' user
sudo -u ubuntu -i <<'EOF'
cd /home/ubuntu

# Remove the directory if it already exists to avoid clone errors on restart
rm -rf aws-new

# Clone the repository
# NOTE: If your repository is private, use: git clone https://<your-token>@github.com/1mp22is038-gif/aws-new.git
git clone https://github.com/1mp22is038-gif/aws-new.git

cd aws-new/Backend

# 5. Set up Environment Variables (.env)
cat <<EOT > .env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://app_user:StrongAppPass123@10.0.172.144:5432/app_db"
JWT_SECRET="super-secret-key-1234"
FRONTEND_URL="*"
EOT

# 6. Install dependencies
npm install --omit=dev

# 7. Start the application with PM2
pm2 start src/index.js --name "stellar-backend"

# Save the PM2 process list so it can resurrect on reboot
pm2 save
EOF

# 8. Set up PM2 to start on system boot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Backend EC2 User Data script completed successfully!"
