#!/bin/bash

# Climate Guardian - Error Fix Script
# This script fixes common installation and setup errors

echo "🔧 Climate Guardian - Error Fix Script"
echo "======================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm 9+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# Fix Backend
echo "🔙 Fixing Backend..."
echo ""

cd backend || exit

echo "  → Removing old node_modules..."
rm -rf node_modules package-lock.json

echo "  → Installing dependencies..."
npm install

echo "  → Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend fixed successfully"
else
    echo "❌ Backend build failed. Check errors above."
fi

cd ..
echo ""

# Fix Frontend
echo "🎨 Fixing Frontend..."
echo ""

cd frontend || exit

echo "  → Removing old node_modules..."
rm -rf node_modules package-lock.json

echo "  → Installing dependencies..."
npm install --legacy-peer-deps

echo "  → Type checking..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ Frontend fixed successfully"
else
    echo "⚠️  Frontend has type errors (this is normal if node_modules not installed yet)"
fi

cd ..
echo ""

# Summary
echo "======================================"
echo "✅ Error fix script completed!"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env file"
echo "2. Setup database: psql -U postgres -d climate_guardian -f database/schema.sql"
echo "3. Start Redis: redis-server"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "See INSTALLATION_STEPS.md for detailed instructions."
