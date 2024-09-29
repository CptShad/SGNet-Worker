const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/.env` });
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

const initRedis = async () => {
  return new Promise((resolve, reject) => {
      try {
          redisClient = new Redis(REDIS_URL);

          // Listen for Redis connection events
          redisClient.on('ready', () => {
              console.log('[Redis] Ready to go.');
              resolve(); // Resolve when Redis is ready
          });

          redisClient.on('error', (err) => {
              if (err.code === "ECONNREFUSED") {
                  console.error(`[Redis] Connection Error: ${err.name}: ${err.message}`);
                  reject(new Error(`[Redis] Connection Error: ${err.message}`));
              } else {
                  console.error('[Redis] Error: ', err.message || "Unexpected Error");
                  reject(new Error(err.message || "Unexpected Error"));
              }
          });

          redisClient.on('end', () => {
              console.warn('[Redis] Connection closed');
          });

      } 
      catch (error) {
          console.error('[Redis] Failed to initialize:', error);
          reject(error); // Reject if there's an issue initializing Redis
      }
  });
};

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