#!/bin/sh

# This script generates a config.js file that will be loaded by index.html
# It injects environment variables into the HTML directory at container startup

CONFIG_PATH="/usr/share/nginx/html/config.js"

# Create the config.js file with the environment variables
cat > $CONFIG_PATH << EOF
window.runtimeConfig = {
  supabaseUrl: "${VITE_SUPABASE_URL}",
  supabaseAnonKey: "${VITE_SUPABASE_ANON_KEY}",
  betterstackIngestingHost: "${VITE_BETTERSTACK_INGESTING_HOST}",
  betterstackSourceToken: "${VITE_BETTERSTACK_SOURCE_TOKEN}",
  appVersion: "${VITE_APP_VERSION}"
};
EOF

# Make sure the file is readable by nginx
chmod 644 $CONFIG_PATH 