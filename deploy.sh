#!/bin/bash

# Exit on any error
set -e

echo "🚀 Deploying updates..."

# Install dependencies in case there are changes
npm install

# Build the application
npm run build

# Check if the PM2 process exists
if pm2 show star-browser > /dev/null 2>&1; then
    # Process exists, restart it
    echo "Restarting existing PM2 process..."
    pm2 restart star-browser
else
    # Process doesn't exist, start it
    echo "Starting new PM2 process..."
    pm2 start npm --name "star-browser" -- start
fi

# Save PM2 process list
pm2 save

echo "✅ Deployment complete!" 