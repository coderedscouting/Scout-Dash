#!/usr/bin/env bash
# One-time setup for local development on macOS / Linux.
# Run this from the root of the project:  bash setup.sh

set -e

echo "Removing old node_modules and lockfile..."
rm -rf node_modules
rm -f pnpm-lock.yaml

echo "Installing dependencies..."
pnpm install

echo ""
echo "Done! To start the app:"
echo "  Terminal 1 (API server):  pnpm dev:api"
echo "  Terminal 2 (Frontend):    pnpm dev:web"
echo ""
echo "Then open http://localhost:5173 in your browser."
echo ""
echo "NOTE: You need a PostgreSQL database."
echo "Set DATABASE_URL in a .env file or as an env variable before starting the API server."
