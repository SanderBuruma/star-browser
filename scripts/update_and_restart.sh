#!/bin/bash

# Define absolute paths
PROJECT_DIR="/var/www/star-browser"
PYTHON_PATH="$PROJECT_DIR/scripts/venv/bin/python"
SCRIPT_DIR="$PROJECT_DIR/scripts"

# Set PATH to include common binary locations
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Activate virtual environment and run update script
"$PYTHON_PATH" "$SCRIPT_DIR/update_data.py" || exit 1

# Set correct permissions for data.json
chown www-data:www-data "$PROJECT_DIR/src/app/data.json" || exit 1
chmod 644 "$PROJECT_DIR/src/app/data.json" || exit 1

# Rebuild the Next.js application
cd "$PROJECT_DIR" && npm run build || exit 1

# Check and restart nginx
if nginx -t; then
    systemctl restart nginx || exit 1
    
    # Restart PM2 processes (assuming PM2 is installed globally)
    pm2 restart all || exit 1
    
    echo "Update complete at $(date)" >> "$PROJECT_DIR/scripts/update.log" || exit 1
else
    echo "Nginx configuration test failed at $(date)" >> "$PROJECT_DIR/scripts/update.log"
    exit 1
fi 