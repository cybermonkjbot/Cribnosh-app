# CribNosh Service Warmer - Cloudflare Worker

A free Cloudflare Worker that keeps your AWS App Runner service warm by making periodic requests to critical endpoints.

## Features

- 🔥 **Automatic Warming**: Runs every 5 minutes via cron trigger
- 🎯 **Smart Endpoint Selection**: Prioritizes critical endpoints
- 🔄 **Retry Logic**: Handles failures gracefully with exponential backoff
- 📊 **Statistics Tracking**: Optional KV storage for monitoring
- 💰 **Free Tier**: Uses Cloudflare's generous free tier
- 🚀 **High Performance**: Edge computing for minimal latency

## Quick Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Configure Your Service URL

The service URL is already configured for `https://cribnosh.com`. If you need to change it, edit `wrangler.toml`:

```toml
[vars]
SERVICE_URL = "https://cribnosh.com"
```

### 4. Deploy the Worker

```bash
npm run deploy
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_URL` | Your CribNosh service URL | https://cribnosh.com |
| `WARMING_INTERVAL` | Interval between warming cycles (seconds) | 300 (5 min) |
| `REQUEST_TIMEOUT` | Request timeout (milliseconds) | 10000 (10s) |

### Endpoints Warmed

The worker warms these endpoints in priority order:

1. `/api/health/fast` - Fast health check (5s timeout)
2. `/api/keep-alive` - Keep alive endpoint (8s timeout)
3. `/api/health` - Full health check (10s timeout)
4. `/` - Home page (10s timeout)
5. `/api/async-tasks` - Async tasks endpoint (10s timeout)

## Optional: Statistics Tracking

To enable statistics tracking, create a KV namespace:

```bash
# Create KV namespace
wrangler kv:namespace create "WARMING_STATS"

# Update wrangler.toml with the returned namespace ID
```

## Manual Testing

### Trigger Manual Warming

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/warm
```

### View Statistics

```bash
curl https://your-worker.your-subdomain.workers.dev/stats
```

## Monitoring

### View Logs

```bash
wrangler tail
```

### Check Worker Status

Visit your worker URL to see the status page with configuration details.

## Cost Analysis

### Cloudflare Free Tier Limits

- **Requests**: 100,000 per day
- **CPU Time**: 10ms per request
- **KV Operations**: 1,000 reads, 1,000 writes per day
- **Cron Triggers**: 1,000 per month

### Usage Estimation

With 5-minute intervals:
- **Daily Requests**: ~288 warming cycles
- **Monthly Requests**: ~8,640 warming cycles
- **Well within free tier limits!**

## Troubleshooting

### Common Issues

1. **Service URL not responding**
   - Check your App Runner service is running
   - Verify the URL is correct in `wrangler.toml`

2. **Worker not triggering**
   - Check cron syntax in `wrangler.toml`
   - Verify deployment was successful

3. **High failure rates**
   - Check your service health endpoints
   - Consider adjusting timeout values

### Debug Mode

Run locally for testing:

```bash
npm run dev
```

## Advanced Configuration

### Custom Endpoints

Edit the `ENDPOINTS` array in `src/index.js`:

```javascript
const ENDPOINTS = [
  {
    path: '/your/custom/endpoint',
    description: 'Custom Endpoint',
    priority: 1,
    timeout: 5000
  },
  // ... existing endpoints
];
```

### Adjust Warming Frequency

Change the cron expression in `wrangler.toml`:

```toml
# Every 3 minutes
[[triggers]]
crons = ["*/3 * * * *"]

# Every 10 minutes
[[triggers]]
crons = ["*/10 * * * *"]
```

## Security Considerations

- The worker includes proper headers to identify warming requests
- No sensitive data is stored in logs
- All requests are logged for monitoring
- KV storage is optional and can be disabled

## Support

For issues or questions:
1. Check the Cloudflare Workers documentation
2. Review the worker logs with `wrangler tail`
3. Test endpoints manually to verify service health

---

**Note**: This worker is designed to be cost-effective and reliable. It uses Cloudflare's free tier and should keep your service warm without any ongoing costs.
