/*
    The heartbeat module will periodically send heartbeat messages to the gateway and register itself.
    This is for monitoring nodes
*/
import { getRedisClient, createNewConnection } from './redis';
import { logger } from '../utils/logger';
const { randomUUID } = require('crypto');

const WORKER_UUID = randomUUID();  // Generate a unique worker UUID when the worker starts
const HEARTBEAT_TTL = 15;  // TTL in seconds for the heartbeat

/**
 * Function to register worker 
 * - store worker data as a hash { created_at, last_heartbeat_at }
 */
const registerWorker = async () => {
    const timestamp = Date.now();

    // Store worker data in a hash with created_at and initial last_heartbeat_at
    await getRedisClient().hset(`workers:registered:${WORKER_UUID}`, {
        created_at: timestamp,
        last_heartbeat_at: timestamp
    });
    await sendHeartbeat();  // Send initial heartbeat
    logger.info(`Worker ${WORKER_UUID} registered at ${new Date(timestamp)}`);
};

/**
 * Function to send heartbeat
 * - updates last_heartbeat_at
 */
const sendHeartbeat = async () => {
    const timestamp = Date.now();

    try {
        let redisClient = createNewConnection();

        // Update last_heartbeat_at field in the hash
        await redisClient.hset(`workers:registered:${WORKER_UUID}`, 'last_heartbeat_at', timestamp);

        // Set a heartbeat key with a TTL
        await redisClient.set(`heartbeats:${WORKER_UUID}`, timestamp, 'EX', HEARTBEAT_TTL);
        logger.info("Heartbeat!");

        await redisClient.quit();
    }
    catch (error) {
        logger.error("Error in sending heartbeat: ", error); // Catch and log any errors
    }
};

export {
    registerWorker,
    sendHeartbeat
};