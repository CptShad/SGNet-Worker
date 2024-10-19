import { getRedisClient, initRedis } from './modules/redis.js';
import { ollamaInference, huggingFaceInference } from './modules/interface.js';
import * as heartbeat from './modules/heartbeat.js';
import { logger } from './utils/logger.js';
import { ChatRedisTaskData, GenerateRedisTaskData } from './types/types.d.js';
import config from './config/config.js';

/**
 * Main GPU Worker
 * - Initialize Redis Client
 * - Wait for messages from the queue
 * - Process the message and return the result to the queue according to provider
 */
async function gpuWorker() {
	const redisClient = await getRedisClient();
	logger.info('Worker ready!');
	while (true) {
		const key = `${config.redis_namespace}:${config.redis_set}`;
		const task = await redisClient.blpop(key, 0);

		if (!task) continue;

		const params = JSON.parse(task[1]) as GenerateRedisTaskData | ChatRedisTaskData;
		const { taskId, provider, stream } = params;

		try {
			let interfaceProvider;
			switch (provider) {
				case 'ollama': {
					interfaceProvider = ollamaInference;
					break;
				}

				case 'huggingface': {
					interfaceProvider = huggingFaceInference;
					break;
				}

				default: {
					interfaceProvider = ollamaInference;
					break;
				}
			}

			await interfaceProvider(params, async (chunk: any) => {
				await redisClient.publish(`result:${taskId}`, JSON.stringify(chunk));
			});

		}
		catch (error: any) {
			await redisClient.publish(`result:${taskId}`, JSON.stringify({ error: error?.message }));
			if (stream) await redisClient.publish(`result:${taskId}`, 'END_OF_STREAM');
		}
	}
}

(async () => {
	try {
		// Initialize Redis before starting the server
		await initRedis();

		// Register worker
		await heartbeat.registerWorker();
		setInterval(heartbeat.sendHeartbeat, 14000);

		// Start worker
		await gpuWorker();
	}
	catch (error: any) {
		logger.error(`Error in GPU worker: ${error?.message}`);
		//process.exit(1); // Exit on error
	}
})();
