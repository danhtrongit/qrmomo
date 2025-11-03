#!/bin/bash

# Build script for production deployment

echo "🏗️  Building MoMo Payment Extractor for Production..."
echo ""

# Check if domain is provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "⚠️  Usage: ./build-production.sh <frontend-domain> <backend-domain>"
    echo ""
    echo "Example:"
    echo "  ./build-production.sh momo.danhtrong.io.vn server.danhtrong.io.vn"
    echo ""
    echo "Or use default:"
    read -p "Frontend domain (default: momo.danhtrong.io.vn): " FRONTEND
    FRONTEND=${FRONTEND:-momo.danhtrong.io.vn}
    
    read -p "Backend domain (default: server.danhtrong.io.vn): " BACKEND
    BACKEND=${BACKEND:-server.danhtrong.io.vn}
else
    FRONTEND=$1
    BACKEND=$2
fi

echo ""
echo "📋 Configuration:"
echo "  Frontend: https://$FRONTEND"
echo "  Backend:  https://$BACKEND"
echo "  WebSocket: wss://$BACKEND"
echo ""

# Set environment variables
export REACT_APP_WS_URL=wss://$BACKEND
export REACT_APP_API_URL=https://$BACKEND
export FAST_REFRESH=false

# Clean old build
echo "🧹 Cleaning old build..."
rm -rf build/

# Build React app
echo "📦 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📊 Build info:"
    echo "  Build directory: $(pwd)/build"
    echo "  Build size: $(du -sh build | cut -f1)"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Deploy build to server:"
    echo "     scp -r build/* user@server:/var/www/momo-payment/build/"
    echo ""
    echo "  2. Configure Extension (in popup):"
    echo "     Server URL: https://$BACKEND"
    echo "     React App URL: https://$FRONTEND"
    echo ""
    echo "  3. Update manifest.json permissions:"
    echo "     https://$FRONTEND/*"
    echo "     https://$BACKEND/*"
    echo ""
    echo "  4. Ensure Nginx is configured with SSL"
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    echo "Check error messages above."
    exit 1
fi

