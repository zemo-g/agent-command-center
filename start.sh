#!/bin/bash
# Start Agent Command Center — game UI + real compute worker
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/Cellar/node@22/22.22.0_1/bin:$PATH"
PYTHON="/opt/homebrew/bin/python3.11"

echo "  AGENT COMMAND CENTER"
echo "  ===================="
echo ""

# Start worker in background
$PYTHON "$DIR/worker.py" &
WORKER_PID=$!
echo "  Worker PID: $WORKER_PID"

# Start vite
cd "$DIR"
npx vite &
VITE_PID=$!
echo "  Vite PID:   $VITE_PID"
echo ""
echo "  Game:   http://localhost:3000"
echo "  Worker: http://localhost:3001"
echo ""
echo "  Press Ctrl+C to stop both."

trap "kill $WORKER_PID $VITE_PID 2>/dev/null; echo '  Stopped.'" EXIT INT TERM
wait
