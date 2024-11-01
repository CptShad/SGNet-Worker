/*
	The heartbeat module will periodically send heartbeat messages to the gateway and register itself.
	This is for monitoring nodes
*/
import { getRedisClient, createNewConnection } from './redis';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';
import config from '../config/config';

const WORKER_UUID = randomUUID();  // Generate a unique worker UUID when the worker starts
const HEARTBEAT_TTL = 15;  // TTL in seconds for the heartbeat
const REGISTER_TTL = 60 * 60 * 24;  // TTL in seconds for the registration

/**
 * Function to register worker 
 * - store worker data as a hash { created_at, last_heartbeat_at }
 */
const registerWorker = async () => {
	const timestamp = Date.now();
	const redisClient = await getRedisClient();
	const WORKER_KEY = `${config.redis_namespace}:workers:registered:${WORKER_UUID}`;

	// Store worker data in a hash with created_at and initial last_heartbeat_at
	await redisClient.hset(WORKER_KEY, {
		created_at: timestamp,
		last_heartbeat_at: timestamp,
	});
	await redisClient.expire(WORKER_KEY, REGISTER_TTL);

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
		const redisClient = await createNewConnection();

		// Update last_heartbeat_at field in the hash
		const WORKER_KEY = `${config.redis_namespace}:workers:registered:${WORKER_UUID}`;
		await redisClient.hset(WORKER_KEY, 'last_heartbeat_at', timestamp);
		await redisClient.expire(WORKER_KEY, REGISTER_TTL);

		// Set a heartbeat key with a TTL
		await redisClient.set(`${config.redis_namespace}:heartbeats:${WORKER_UUID}`, timestamp, 'EX', HEARTBEAT_TTL);
		// logger.info("Heartbeat!");

		await redisClient.quit();
	}
	catch (error: any) {
		logger.error(`Error in sending heartbeat: ${error?.message}`); // Catch and log any errors
	}
};

export {
	registerWorker,
	sendHeartbeat,
};
