// Simple Lambda function to keep App Runner instances warm
// This function runs every few minutes to ping the keep-alive endpoint

interface LambdaEvent {
  [key: string]: unknown;
}

interface LambdaContext {
  [key: string]: unknown;
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface KeepAliveConfig {
  serviceUrl: string;
  intervalMinutes: number;
  concurrency: number;
}

/**
 * Lambda function to keep App Runner instances warm
 * This function runs every few minutes to ping the keep-alive endpoint
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<LambdaResponse> => {
  try {
    const config: KeepAliveConfig = {
      serviceUrl: process.env.SERVICE_URL || 'https://cribnosh.co.uk',
      intervalMinutes: parseInt(process.env.KEEP_ALIVE_INTERVAL || '5'),
      concurrency: parseInt(process.env.KEEP_ALIVE_CONCURRENCY || '10')
    };

    console.log('Starting keep-alive process', config);

    // Send keep-alive requests to multiple endpoints to ensure all instances stay warm
    const keepAlivePromises = [
      pingEndpoint(`${config.serviceUrl}/api/keep-alive`),
      pingEndpoint(`${config.serviceUrl}/api/health/fast`),
      pingEndpoint(`${config.serviceUrl}/api/health`),
      pingEndpoint(`${config.serviceUrl}/`),
    ];

    // Send multiple concurrent requests to simulate real traffic
    const concurrentPromises = Array.from({ length: config.concurrency }, () => 
      Promise.all(keepAlivePromises)
    );

    const results = await Promise.allSettled(concurrentPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Keep-alive completed: ${successful} successful, ${failed} failed`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Keep-alive process completed',
        stats: {
          successful,
          failed,
          totalRequests: results.length * keepAlivePromises.length
        }
      })
    };

  } catch (error) {
    console.error('Keep-alive process failed:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Ping a specific endpoint with timeout
 */
async function pingEndpoint(url: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'KeepAlive-Lambda/1.0',
        'X-Keep-Alive': 'true'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`Successfully pinged ${url}`);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Failed to ping ${url}:`, error);
    throw error;
  }
}
