const Redis = require('ioredis');
const dotenv = require('dotenv');
const { logger } = require("../utils/logger.js");

dotenv.config({ path: `${__dirname}/../.env` });
const REDIS_IP = process.env.REDIS_IP || 'localhost:6379';

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
            dotenv.config({ path: `${__dirname}/.env` });
            redisClient = createNewConnection();

            redisClient.on('connect', () => {
                logger.info('[Redis] Connecting...');
            });

            // Listen for Redis connection events
            redisClient.on('ready', () => {
                logger.info('[Redis] Ready to go.');
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

/**
 * Create new redis connection
 * @returns {Redis.Redis}
 */
const createNewConnection = () => {
    return new Redis({
        host: REDIS_IP.split(':')[0],
        port: REDIS_IP.split(':')[1]
    });
}

module.exports = {
    initRedis: initRedis,
    getRedisClient: getRedisClient,
    createNewConnection: createNewConnection
};