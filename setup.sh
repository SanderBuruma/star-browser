#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting setup of Star Browser application..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
echo "📦 Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials (needed for some npm packages)
echo "🔧 Installing build essentials..."
sudo apt-get install -y build-essential

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the application
echo "🏗️ Building the application..."
npm run build

# Install PM2 globally for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Start the application with PM2
echo "🚀 Starting the application..."
pm2 start npm --name "star-browser" -- start

# Save PM2 process list and configure to start on reboot
echo "⚙️ Configuring PM2 startup..."
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Install and configure Nginx
echo "🔧 Installing and configuring Nginx..."
sudo apt-get install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/star-browser << 'EOF'
server {
    listen 80;
    server_name factorio.sanderburuma.nl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/star-browser /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Install and configure UFW firewall
echo "🔒 Configuring firewall..."
sudo apt-get install -y ufw
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ Setup complete! Your application should now be running."
echo "🌐 You can access it at http://factorio.sanderburuma.nl"
echo ""
echo "Useful commands:"
echo "- 'pm2 status' to check application status"
echo "- 'pm2 logs' to view application logs"
echo "- 'sudo nginx -t' to test Nginx configuration"
echo "- 'sudo systemctl status nginx' to check Nginx status" 