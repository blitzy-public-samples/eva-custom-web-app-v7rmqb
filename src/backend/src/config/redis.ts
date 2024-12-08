// redis v4.6.7
import { createClient, RedisClientType } from 'redis';
import { initializeLogger, logInfo, logError } from '../utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure REDIS_URL environment variable is set in deployment configurations
 * 2. Configure Redis persistence settings in production
 * 3. Set up Redis monitoring and alerting
 * 4. Configure Redis backup strategy
 * 5. Set up Redis cluster mode if needed for scaling
 */

// Global Redis connection URL with fallback to localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Initializes and configures the Redis client for the backend.
 * Requirement: Caching Layer - Implements Redis as a caching layer for session and temporary data storage.
 * 
 * @returns {Promise<RedisClientType>} A configured Redis client instance
 */
export const initializeRedis = async (): Promise<RedisClientType> => {
    // Initialize the Redis client with the connection URL
    const client = createClient({
        url: REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                // Exponential backoff with max retry delay of 3 seconds
                const delay = Math.min(retries * 100, 3000);
                return delay;
            }
        }
    });

    // Initialize logger for Redis events
    const logger = initializeLogger();

    // Set up event listeners for connection status
    client.on('connect', () => {
        logInfo('Redis client connecting...');
    });

    client.on('ready', () => {
        logInfo('Redis client connected and ready');
    });

    client.on('error', (err: Error) => {
        logError(err);
    });

    client.on('reconnecting', () => {
        logInfo('Redis client reconnecting...');
    });

    client.on('end', () => {
        logInfo('Redis client connection closed');
    });

    // Connect to Redis server
    try {
        await client.connect();
    } catch (error) {
        logError(error as Error);
        throw error;
    }

    // Set client configuration options
    await client.configSet('maxmemory-policy', 'allkeys-lru'); // Least Recently Used eviction policy
    await client.configSet('notify-keyspace-events', 'Ex'); // Enable keyspace notifications for expired keys

    return client;
};