#!/bin/bash
# ===========================================
# OpenCode Auto Interface - Real Execution Setup
# ===========================================
# This script starts both the OpenCode server and frontend
# to enable REAL code execution (not demo mode)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCODE_DIR="$(cd "$ROOT_DIR/.." && pwd)"

echo "========================================"
echo "🚀 OpenCode Auto Interface - Real Mode"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for API keys
check_api_keys() {
    echo -e "\n${BLUE}Checking API keys...${NC}"
    
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${NC}"
        return 0
    fi
    
    if [ -n "$OPENAI_API_KEY" ]; then
        echo -e "${GREEN}✓ OPENAI_API_KEY is set${NC}"
        return 0
    fi
    
    # Check if .env file exists
    if [ -f "$SCRIPT_DIR/.env" ]; then
        source "$SCRIPT_DIR/.env"
        if [ -n "$ANTHROPIC_API_KEY" ] || [ -n "$OPENAI_API_KEY" ]; then
            echo -e "${GREEN}✓ API key found in .env file${NC}"
            return 0
        fi
    fi
    
    echo -e "${RED}✗ No API keys found!${NC}"
    echo ""
    echo "To use real AI execution, you need to set API keys:"
    echo ""
    echo "Option 1: Export environment variable"
    echo "  export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here"
    echo "  # OR"
    echo "  export OPENAI_API_KEY=sk-your-openai-key-here"
    echo ""
    echo "Option 2: Create .env file"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your API keys"
    echo ""
    return 1
}

# Function to start OpenCode server
start_server() {
    echo -e "\n${BLUE}Starting OpenCode Server on port 4096...${NC}"
    cd "$OPENCODE_DIR"
    
    # Check if server is already running
    if curl -s http://localhost:4096/provider > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OpenCode server is already running${NC}"
        return 0
    fi
    
    # Start the server in background
    echo "Starting server with: bun run dev"
    bun run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:4096/provider > /dev/null 2>&1; then
            echo -e "${GREEN}✓ OpenCode server is ready!${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "${RED}✗ Server failed to start within 30 seconds${NC}"
    return 1
}

# Function to start frontend
start_frontend() {
    echo -e "\n${BLUE}Starting Frontend on port 3000...${NC}"
    cd "$SCRIPT_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/react" ]; then
        echo "Installing dependencies..."
        bun install
    fi
    
    # Start frontend
    echo "Starting frontend with: bun run dev"
    bun run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend
    for i in {1..15}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend is ready!${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "${YELLOW}Frontend may still be starting...${NC}"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main
main() {
    # Load .env if exists
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
        echo -e "${GREEN}✓ Loaded .env file${NC}"
    fi
    
    # Check API keys (warning only, don't fail)
    check_api_keys || echo -e "${YELLOW}Continuing without API keys - you can add them later via the UI${NC}"
    
    # Start server
    start_server || exit 1
    
    # Start frontend
    start_frontend
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}✓ OpenCode Auto Interface is LIVE!${NC}"
    echo "========================================"
    echo ""
    echo "Frontend: http://localhost:3000"
    echo "Server:   http://localhost:4096"
    echo ""
    echo "To configure API keys:"
    echo "  1. Open the frontend"
    echo "  2. Go to the Planning stage"
    echo "  3. Click 'Advanced Configuration'"
    echo ""
    echo "Or set environment variables and restart:"
    echo "  export ANTHROPIC_API_KEY=your-key"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    echo ""
    
    # Wait for processes
    wait
}

main "$@"
