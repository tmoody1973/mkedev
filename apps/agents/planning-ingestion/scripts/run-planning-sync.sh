#!/bin/bash
#
# Run Planning Ingestion Agent
#
# Usage:
#   ./scripts/run-planning-sync.sh weekly     # Sync weekly sources
#   ./scripts/run-planning-sync.sh monthly    # Sync monthly sources
#   ./scripts/run-planning-sync.sh all        # Sync all sources
#   ./scripts/run-planning-sync.sh all --force  # Force re-sync all
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to agent directory
cd "$AGENT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check for virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Parse arguments
SYNC_TYPE="${1:-weekly}"
shift || true
EXTRA_ARGS="$@"

# Run the sync
case "$SYNC_TYPE" in
    weekly)
        echo "Running weekly sync..."
        python main.py sync --frequency weekly $EXTRA_ARGS
        ;;
    monthly)
        echo "Running monthly sync..."
        python main.py sync --frequency monthly $EXTRA_ARGS
        ;;
    all)
        echo "Running full sync..."
        python main.py sync --all $EXTRA_ARGS
        ;;
    list)
        echo "Listing sources..."
        python main.py list
        ;;
    *)
        echo "Unknown sync type: $SYNC_TYPE"
        echo "Usage: $0 {weekly|monthly|all|list} [--force] [--dry-run]"
        exit 1
        ;;
esac

echo "Done!"
