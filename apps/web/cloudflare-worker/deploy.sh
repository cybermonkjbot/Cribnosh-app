# Cloudflare Worker Deployment Script

This script automates the deployment of the CribNosh warming worker to Cloudflare.

set -e

echo "🚀 Deploying CribNosh Service Warmer to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare first:"
    wrangler login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Validate configuration
echo "🔍 Validating configuration..."
if ! grep -q "SERVICE_URL.*cribnosh.com" wrangler.toml; then
    echo "⚠️  Warning: SERVICE_URL in wrangler.toml doesn't point to cribnosh.com"
    echo "   Current configuration:"
    grep "SERVICE_URL" wrangler.toml
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Deploy the worker
echo "🚀 Deploying worker..."
wrangler deploy

echo "✅ Deployment completed!"
echo ""
echo "📊 Next steps:"
echo "1. Test the worker: curl https://your-worker.your-subdomain.workers.dev"
echo "2. Monitor logs: wrangler tail"
echo "3. Check cron triggers are working (wait 5 minutes)"
echo ""
echo "🔧 Manual warming: curl -X POST https://your-worker.your-subdomain.workers.dev/warm"
echo "📈 View stats: curl https://your-worker.your-subdomain.workers.dev/stats"
