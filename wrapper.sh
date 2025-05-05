#!/bin/bash

# Exit on errors
set -e

# Step 1: Install NVM if not already installed
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
  source ~/.bashrc
else
  echo "NVM already installed."
  source ~/.bashrc
fi

# Step 2: Install Node.js 16 if not already installed
nvm install 16
nvm use 16

# Step 3: Go to project root (adjust if needed)
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# Step 4: Run backend (azkaban_proxy)
echo "Setting up azkaban_proxy..."
cd azkaban_proxy
npm install

echo "Starting azkaban_proxy (Node.js backend)..."
nohup npm start > proxy.log 2>&1 &

# Step 5: Run frontend (azkaban_react)
echo "Setting up azkaban_react..."
cd ../azkaban_react
npm install

echo "Starting azkaban_react (React frontend)..."
nohup npm start > react.log 2>&1 &

echo "✅ Azkaban project started successfully."
echo "🔧 Backend log: azkaban_proxy/proxy.log"
echo "🌐 Frontend log: azkaban_react/react.log"

