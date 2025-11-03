#!/bin/bash

echo "========================================"
echo "PM2 Fix Script - MoMo QR Payment System"
echo "========================================"
echo ""

# Step 1: Update PM2 to match in-memory version
echo "📦 Step 1: Updating PM2..."
pm2 update
echo "✅ PM2 updated"
echo ""

# Step 2: Kill PM2 daemon to force restart
echo "🔄 Step 2: Killing PM2 daemon..."
pm2 kill
echo "✅ PM2 daemon killed"
echo ""

# Step 3: Delete old processes
echo "🗑️  Step 3: Deleting old processes..."
pm2 delete all 2>/dev/null || true
echo "✅ Old processes deleted"
echo ""

# Step 4: Start fresh with ecosystem config
echo "🚀 Step 4: Starting applications..."
pm2 start ecosystem.config.js
echo "✅ Applications started"
echo ""

# Step 5: Save PM2 process list
echo "💾 Step 5: Saving PM2 configuration..."
pm2 save --force
echo "✅ PM2 configuration saved"
echo ""

# Step 6: Setup PM2 startup (optional, only if needed)
echo "⚙️  Step 6: Setting up PM2 startup (optional)..."
echo "Run this command manually if needed:"
echo "pm2 startup"
echo ""

# Step 7: Show status
echo "📊 Step 7: Current PM2 status:"
pm2 list
echo ""

echo "========================================"
echo "✅ PM2 Fix Complete!"
echo "========================================"
echo ""
echo "Your applications should now be running:"
echo "  - momo-websocket-server (Port 4105)"
echo "  - momo-react-app (Port 4104)"
echo ""
echo "Useful commands:"
echo "  pm2 list          - Show all processes"
echo "  pm2 logs          - View all logs"
echo "  pm2 restart all   - Restart all apps"
echo "  pm2 stop all      - Stop all apps"
echo ""

