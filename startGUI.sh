#!/bin/bash

# Define a function to clean up background processes if the script is interrupted
function cleanup() {
    echo "Interrupt received. Killing background processes..."
    kill $(jobs -p)
    exit 1
}

# Trap Ctrl-C (INT signal) to run the cleanup function
trap cleanup INT


echo "Starting Backend..."
(cd backend && node index.js) &
PID1=$!

echo "Starting ROSBridge..."
(ros2 launch rosbridge_server rosbridge_websocket_launch.xml) &
PID2=$!

echo "Starting Frontend..."
(cd frontend &&  npm run start) &
PID3=$!
# Wait for all background jobs (specified by their PIDs)
wait $PID1 $PID2 $PID3

echo "All processes have finished."

