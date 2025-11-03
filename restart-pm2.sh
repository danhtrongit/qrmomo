#!/bin/bash

# Simple PM2 restart script for production
# Use this when you just need to restart the services

echo "🔄 Restarting PM2 services..."
echo ""

# Update PM2 first
pm2 update

# Kill and restart
pm2 kill
sleep 2

# Start with ecosystem config
pm2 start ecosystem.config.js

# Save configuration
pm2 save --force

echo ""
echo "✅ Done! Services restarted."
echo ""
pm2 list

