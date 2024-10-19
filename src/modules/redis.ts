import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../../.env` });
const REDIS_IP = process.env.REDIS_IP || 'localhost:6379';

let redisClient: Redis;

/**
 * Iniatialize Redis Client
 * @returns {Promise<void>}
 */
async function initRedis(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		try {
			redisClient = createNewConnection();

			redisClient.on('connect', () => {
				logger.info('[Redis] Connecting...');
			});

			// Listen for Redis connection events
			redisClient.on('ready', () => {
				logger.log('[Redis] Ready to go.');
				resolve(); // Resolve when Redis is ready
			});

			redisClient.on('error', (err: any) => {
				if (err?.code === 'ECONNREFUSED') {
					logger.error(`[Redis] Connection Error: ${err?.name}: ${err?.message}`);
					reject(new Error(`[Redis] Connection Error: ${err?.message}`));
				} else {
					logger.error(`[Redis] Error: ${err.message ?? 'Unexpected Error'}`);
					reject(new Error(err.message || 'Unexpected Error'));
				}
			});

			redisClient.on('end', () => {
				logger.warn('[Redis] Connection closed');
			});

		}
		catch (error: any) {
			logger.error(`[Redis] Failed to initialize: ${error?.message}`);
			reject(error); // Reject if there's an issue initializing Redis
		}
	});
}

/**
 * Get redis client instance.
 * @returns {Redis} Redis client instance
 */
async function getRedisClient(): Promise<Redis> {
	if (!redisClient) {
		throw new Error('[Redis] Redis client not initialized');
	}
	return redisClient;
}

/**
 * Create new redis connection
 * @returns {Promise<Redis>}
 */
function createNewConnection(): Redis {
	const [host, port] = REDIS_IP.split(':');
	return new Redis({
		host,
		port: parseInt(port, 10),
	});
}

export {
	initRedis,
	getRedisClient,
	createNewConnection,
};
