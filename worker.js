import { getRedisClient, initRedis } from './modules/redis.js';
import { ollamaInference, huggingFaceInference } from './modules/interface.js';
import dotenv from 'dotenv';
const { logger } = require("./utils/logger.js");

// Load environment variables from .env file
dotenv.config({ path: `${__dirname}/.env` });

/**
 * Main GPU Worker
 * - Initialize Redis Client
 * - Wait for messages from the queue
 * - Process the message and return the result to the queue according to provider
 */
async function gpuWorker() {
	const redis = getRedisClient();
	logger.info("Worker ready!");
	while (true) {
		const task = await redis.blpop('llm_tasks', 0);
		const params = JSON.parse(task[1]);
		const { taskId, provider, stream } = JSON.parse(task[1]);

		try {
			let interfaceProvider;
			switch (provider) {
				case "ollama": {
					interfaceProvider = ollamaInference;
				}
					break;

				case "huggingface": {
					interfaceProvider = huggingFaceInference;
				}
					break;

				default: {
					interfaceProvider = ollamaInference;
				}
					break;
			}

			await interfaceProvider(params, async (chunk) => {
				await redis.publish(`result:${taskId}`, JSON.stringify(chunk));
			});

			// Signal end of stream
			if (stream) await redis.publish(`result:${taskId}`, 'END_OF_STREAM');
		}
		catch (error) {
			await redis.publish(`result:${taskId}`, JSON.stringify({ error: error?.message }));
			if (stream) await redis.publish(`result:${taskId}`, 'END_OF_STREAM');
		}
	}
}

(async () => {
	try {
		// Initialize Redis before starting the server
		await initRedis();

		// Start worker
		gpuWorker();
	}
	catch (error) {
		logger.error('Error in GPU worker: ', error);
		//process.exit(1); // Exit on error
	}
})();