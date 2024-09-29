import { getRedisClient, initRedis } from './modules/redis.js';
import { ollamaInference, huggingFaceInference } from './modules/interface.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: `${__dirname}/.env` });

async function gpuWorker() {
	const redis = getRedisClient();

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
        console.error('Error in GPU worker: ', error);
        //process.exit(1); // Exit on error
    }
})();