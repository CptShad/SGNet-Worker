const Redis = require('ioredis');
const dotenv = require('dotenv');
const { logger } = require("../utils/logger.js");

dotenv.config({ path: `${__dirname}/.env` });
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * @type {Redis.Redis}
 */
let redisClient;

/**
 * Iniatialize Redis Client
 * @returns 
 */
const initRedis = async () => {
    return new Promise((resolve, reject) => {
        try {
            redisClient = new Redis(REDIS_URL);

            // Listen for Redis connection events
            redisClient.on('ready', () => {
                logger.log('[Redis] Ready to go.');
                resolve(); // Resolve when Redis is ready
            });

            redisClient.on('error', (err) => {
                if (err.code === "ECONNREFUSED") {
                    logger.error(`[Redis] Connection Error: ${err.name}: ${err.message}`);
                    reject(new Error(`[Redis] Connection Error: ${err.message}`));
                } else {
                    logger.error('[Redis] Error: ', err.message || "Unexpected Error");
                    reject(new Error(err.message || "Unexpected Error"));
                }
            });

            redisClient.on('end', () => {
                logger.warn('[Redis] Connection closed');
            });

        }
        catch (error) {
            logger.error('[Redis] Failed to initialize:', error);
            reject(error); // Reject if there's an issue initializing Redis
        }
    });
};

/**
 * Get redis client instance.
 * @returns {Redis.Redis} Redis client instance
 */
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('[Redis] Redis client not initialized');
    }
    return redisClient;
};

module.exports = {
    initRedis: initRedis,
    getRedisClient: getRedisClient
};