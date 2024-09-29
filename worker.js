import { getRedisClient, initRedis } from './modules/redis.js';
import { ollamaInference, huggingFaceInference, streamingOllamaInference } from './modules/interface.js';
import dotenv from 'dotenv';
import { parseResponse } from './utils/utils.js';

// Load environment variables from .env file
dotenv.config();

async function gpuWorker() {
	initRedis();
	const redis = getRedisClient();

	while (true) {
		const task = await redis.blpop('llm_tasks', 0);
		const { taskId, provider, model, prompt, message, stream } = JSON.parse(task[1]);

		try {
			let interfaceProvider;
			switch (provider) {
				case "ollama": {
					interfaceProvider = stream ? streamingOllamaInference : ollamaInference;
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

			await interfaceProvider(model, prompt, async (chunk) => {
				await redis.publish(`result:${taskId}`, JSON.stringify(chunk));
			});

			// Signal end of stream
			await redis.publish(`result:${taskId}`, 'END_OF_STREAM');
		} 
		catch (error) {
			await redis.publish(`result:${taskId}`, JSON.stringify({ error: error?.message }));
			await redis.publish(`result:${taskId}`, 'END_OF_STREAM');
		}
	}
}

gpuWorker().catch(console.error);