/**
 * Redis Configuration Module
 * Version: 1.0.0
 * 
 * Provides Redis connection and configuration settings for Estate Kit platform
 * Implements high-availability, clustering, and secure session storage
 * 
 * @module config/redis
 * @requires ioredis ^5.0.0
 */

import Redis, { RedisOptions, ClusterOptions, Cluster } from 'ioredis'; // ^5.0.0

/**
 * Interface for Redis node configuration in cluster mode
 */
interface RedisNode {
  host: string;
  port: number;
}

/**
 * Custom error class for Redis connection issues
 */
class RedisConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

/**
 * Custom error class for Redis cluster operations
 */
class RedisClusterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisClusterError';
  }
}

/**
 * Base Redis configuration
 */
export const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'estatekit:',
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  connectTimeout: 10000,
  disconnectTimeout: 5000,
  commandTimeout: 5000,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  lazyConnect: true,
  tls: process.env.REDIS_TLS_ENABLED === 'true' ? { rejectUnauthorized: true } : undefined
};

/**
 * TTL configurations for different cache types (in seconds)
 */
export const REDIS_TTL = {
  session: 1800,      // 30 minutes
  cache: 3600,        // 1 hour
  rateLimit: 60,      // 1 minute
  refreshToken: 604800, // 7 days
  tempToken: 300      // 5 minutes
} as const;

/**
 * Creates and configures a new Redis client instance
 * @param options - Optional Redis configuration overrides
 * @returns Configured Redis client instance
 */
export async function createRedisClient(
  options: Partial<RedisOptions> = {}
): Promise<Redis> {
  const config = { ...REDIS_CONFIG, ...options };
  const client = new Redis(config);

  // Error handling
  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  // Connection monitoring
  client.on('connect', () => {
    console.info('Redis client connected');
  });

  client.on('ready', () => {
    console.info('Redis client ready');
  });

  client.on('close', () => {
    console.warn('Redis client connection closed');
  });

  // Implement health check mechanism
  const healthCheck = async () => {
    try {
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  };

  // Add healthCheck as a property to the client type
  (client as any).healthCheck = healthCheck;

  return client;
}

/**
 * Creates a Redis cluster client for high-availability setups
 * @param nodes - Array of Redis cluster nodes
 * @param options - Optional cluster configuration overrides
 * @returns Configured Redis cluster client
 */
export async function createRedisCluster(
  nodes: RedisNode[],
  options: Partial<ClusterOptions> = {}
): Promise<Cluster> {
  if (!nodes || nodes.length === 0) {
    throw new RedisClusterError('No cluster nodes provided');
  }

  const defaultClusterOptions: ClusterOptions = {
    clusterRetryStrategy: (times: number) => Math.min(times * 100, 3000),
    enableReadyCheck: true,
    scaleReads: 'slave',
    redisOptions: REDIS_CONFIG,
    ...options
  };

  const cluster = new Redis.Cluster(nodes, defaultClusterOptions);

  // Cluster event handling
  cluster.on('node error', (error, node) => {
    console.error(`Redis cluster node error (${node.host}:${node.port}):`, error);
  });

  cluster.on('+node', (node) => {
    console.info(`Redis cluster node added: ${node.host}:${node.port}`);
  });

  cluster.on('-node', (node) => {
    console.warn(`Redis cluster node removed: ${node.host}:${node.port}`);
  });

  // Implement cluster health check
  const clusterHealthCheck = async () => {
    try {
      const nodes = await cluster.nodes();
      const nodeChecks = await Promise.all(
        nodes.map(async (node) => {
          try {
            await node.ping();
            return true;
          } catch {
            return false;
          }
        })
      );
      return nodeChecks.every(Boolean);
    } catch (error) {
      console.error('Redis cluster health check failed:', error);
      return false;
    }
  };

  // Add healthCheck as a property to the cluster type
  (cluster as any).healthCheck = clusterHealthCheck;

  return cluster;
}

// Create default Redis client instance
const redisClient = createRedisClient();

export default redisClient;