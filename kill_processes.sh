#!/bin/bash

echo "🔍 Looking for running Azkaban-related Node.js processes..."

# Kill azkaban_proxy
PROXY_PIDS=$(ps -ef | grep 'azkaban_proxy' | grep node | awk '{print $2}')
if [ -n "$PROXY_PIDS" ]; then
  echo "🛑 Killing azkaban_proxy (PIDs: $PROXY_PIDS)"
  echo "$PROXY_PIDS" | xargs -r kill -9
else
  echo "✅ No azkaban_proxy process found."
fi

# Kill azkaban_react
REACT_PIDS=$(ps -ef | grep 'azkaban_react' | grep node | awk '{print $2}')
if [ -n "$REACT_PIDS" ]; then
  echo "🛑 Killing azkaban_react (PIDs: $REACT_PIDS)"
  echo "$REACT_PIDS" | xargs -r kill -9
else
  echo "✅ No azkaban_react process found."
fi

echo "✅ All matching processes have been handled."

