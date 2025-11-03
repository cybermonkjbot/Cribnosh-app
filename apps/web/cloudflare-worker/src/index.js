/**
 * CribNosh Service Warmer - Cloudflare Worker
 * 
 * This worker keeps your AWS App Runner service warm by making periodic requests
 * to critical endpoints. Runs every 5 minutes via cron trigger.
 * 
 * Features:
 * - Multiple endpoint warming
 * - Error handling and retry logic
 * - Performance monitoring
 * - Statistics tracking
 * - Free tier friendly
 */

// Configuration factory
function getConfig(env) {
  return {
    SERVICE_URL: env.SERVICE_URL || 'https://cribnosh.com',
    WARMING_INTERVAL: parseInt(env.WARMING_INTERVAL) || 300, // 5 minutes
    REQUEST_TIMEOUT: parseInt(env.REQUEST_TIMEOUT) || 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  };
}

// Endpoints to warm (in order of priority)
const ENDPOINTS = [
  {
    path: '/api/health/fast',
    description: 'Fast Health Check',
    priority: 1,
    timeout: 5000
  },
  {
    path: '/api/keep-alive',
    description: 'Keep Alive',
    priority: 2,
    timeout: 8000
  },
  {
    path: '/api/health',
    description: 'Full Health Check',
    priority: 3,
    timeout: 10000
  },
  {
    path: '/',
    description: 'Home Page',
    priority: 4,
    timeout: 10000
  },
  {
    path: '/api/async-tasks',
    description: 'Async Tasks',
    priority: 5,
    timeout: 10000
  }
];

/**
 * Make a warming request to an endpoint
 */
async function warmEndpoint(endpoint, config, attempt = 1) {
  const url = `${config.SERVICE_URL}${endpoint.path}`;
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CribNosh-Warmer/1.0',
        'X-Warming-Request': 'true',
        'X-Attempt': attempt.toString(),
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    const result = {
      endpoint: endpoint.path,
      description: endpoint.description,
      status: response.status,
      duration: duration,
      success: response.ok,
      attempt: attempt,
      timestamp: new Date().toISOString(),
    };
    
    // Log the result
    console.log(`🔥 ${endpoint.description}: ${response.status} (${duration}ms)`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const result = {
      endpoint: endpoint.path,
      description: endpoint.description,
      status: 0,
      duration: duration,
      success: false,
      error: error.message,
      attempt: attempt,
      timestamp: new Date().toISOString(),
    };
    
    console.error(`❌ ${endpoint.description}: ${error.message} (${duration}ms)`);
    
    return result;
  }
}

/**
 * Warm an endpoint with retry logic
 */
async function warmEndpointWithRetry(endpoint, config) {
  let lastResult = null;
  
  for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
    lastResult = await warmEndpoint(endpoint, config, attempt);
    
    if (lastResult.success) {
      return lastResult;
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < config.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY * attempt));
    }
  }
  
  return lastResult;
}

/**
 * Warm all endpoints
 */
async function warmAllEndpoints(config) {
  console.log(`🚀 Starting warming cycle at ${new Date().toISOString()}`);
  
  const results = [];
  const startTime = Date.now();
  
  // Warm endpoints in priority order
  for (const endpoint of ENDPOINTS) {
    try {
      const result = await warmEndpointWithRetry(endpoint, config);
      results.push(result);
      
      // Brief pause between endpoints to avoid overwhelming the service
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`💥 Failed to warm ${endpoint.description}:`, error);
      results.push({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 0,
        duration: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`✅ Warming cycle completed: ${successCount} success, ${failureCount} failures (${totalDuration}ms total)`);
  
  return {
    results,
    summary: {
      totalEndpoints: results.length,
      successCount,
      failureCount,
      totalDuration,
      timestamp: new Date().toISOString(),
    }
  };
}

/**
 * Store warming statistics in KV (optional)
 */
async function storeStats(summary, env) {
  if (!env.WARMING_STATS) {
    return; // KV not configured
  }
  
  try {
    const statsKey = `warming-stats-${new Date().toISOString().split('T')[0]}`;
    const existingStats = await env.WARMING_STATS.get(statsKey);
    
    let stats = existingStats ? JSON.parse(existingStats) : {
      date: new Date().toISOString().split('T')[0],
      cycles: [],
      totalCycles: 0,
      totalSuccesses: 0,
      totalFailures: 0,
    };
    
    stats.cycles.push(summary);
    stats.totalCycles++;
    stats.totalSuccesses += summary.successCount;
    stats.totalFailures += summary.failureCount;
    
    // Keep only last 100 cycles per day
    if (stats.cycles.length > 100) {
      stats.cycles = stats.cycles.slice(-100);
    }
    
    await env.WARMING_STATS.put(statsKey, JSON.stringify(stats));
    console.log(`📊 Stats stored for ${statsKey}`);
    
  } catch (error) {
    console.error('Failed to store stats:', error);
  }
}

/**
 * Handle cron trigger
 */
async function handleCronTrigger(env) {
  try {
    const config = getConfig(env);
    const warmingResult = await warmAllEndpoints(config);
    
    // Store statistics
    await storeStats(warmingResult.summary, env);
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Warming cycle completed',
      summary: warmingResult.summary,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Warming cycle failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Handle manual trigger via HTTP request
 */
async function handleHttpRequest(request, env) {
  const url = new URL(request.url);
  
  if (url.pathname === '/warm' && request.method === 'POST') {
    return await handleCronTrigger(env);
  }
  
  if (url.pathname === '/stats' && request.method === 'GET') {
    if (!env.WARMING_STATS) {
      return new Response(JSON.stringify({
        error: 'KV storage not configured'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const statsKey = `warming-stats-${new Date().toISOString().split('T')[0]}`;
      const stats = await env.WARMING_STATS.get(statsKey);
      
      return new Response(stats || '{}', {
        headers: { 'Content-Type': 'application/json' },
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // Default response
  const config = getConfig(env);
  return new Response(JSON.stringify({
    service: 'CribNosh Warmer',
    version: '1.0.0',
    endpoints: {
      warm: 'POST /warm - Trigger manual warming',
      stats: 'GET /stats - Get warming statistics',
    },
    config: {
      serviceUrl: config.SERVICE_URL,
      warmingInterval: config.WARMING_INTERVAL,
      endpoints: ENDPOINTS.length,
    },
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Main handler
 */
const worker = {
  async fetch(request, env) {
    return await handleHttpRequest(request, env);
  },
  
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCronTrigger(env));
  },
};

export default worker;
