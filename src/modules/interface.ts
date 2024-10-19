import { fetch } from 'bun';
import { logger } from '../utils/logger.js';
import { sanitizeOllamaPayload } from '../utils/utils.js';
import config from '../config/config.js';

/**
 * Interacts with ollamas API based on params.
 * - Sanitize payload
 * - Make request to ollamas API (generate/chat)
 * - Return result to callback.
 * @param {*} params 
 * @param {*} callback 
 * @returns 
 */
export async function ollamaInference(params: any, callback: any) {
	try {
		// Get the Ollama IP from the environment variable
		const OLLAMA_IP = config.ollama_ip || 'localhost:11434';
		const { taskId, stream, type } = params;

		// Prepare the request payload
		const payload = sanitizeOllamaPayload(params);

		// Send the POST request to Ollama's API
		const url = `http://${OLLAMA_IP}/${type === 'generate' ? 'api/generate' : 'api/chat'}`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		// Check if the response is ok (status 200-299)
		if (!response.ok) {
			let errorMessage = `Ollama inference failed for taskId ${taskId} with status ${response.status}: ${response.statusText}`;
			try {
				const errorResult: any = await response.json();
				if (errorResult?.error) {
					errorMessage += ` - Error: ${errorResult.error}`;
					logger.error(`Ollama interface error for taskId ${taskId}: ${errorResult.error}`);
				}
			}
			catch (parseError: any) {
				logger.error(`Error parsing Ollama error response for taskId ${taskId}: ${parseError.message}`);
			}
			throw new Error(errorMessage);
		}

		if (stream) {
			if (!response.body) {
				throw new Error(`No response body for taskId ${taskId}`);
			}
			// Get the response body as a ReadableStream
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Process complete JSON objects
				let newlineIndex;
				while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
					const chunk = buffer.slice(0, newlineIndex);
					buffer = buffer.slice(newlineIndex + 1);

					try {
						const jsonChunk = JSON.parse(chunk);
						await callback(jsonChunk);
						if (jsonChunk.done) {
							logger.log(`Successfully finished chunk processing for taskId ${taskId}`);
							return await callback('END_OF_STREAM');
						}
					}
					catch (e) {
						logger.error(`Error parsing JSON chunk for taskId ${taskId}: ${e}`);
					}

				}
			}
		}
		else {
			const result = await response.text();
			logger.log(`Successfully fetched ollama result for taskId ${taskId} with response ${result}`);
			return callback(result);
		}

	}
	catch (error: any) {
		logger.error(`Error during Ollama inference for taskId ${params.taskId}: ${error.message}`);
		throw error;
	}
}

export async function huggingFaceInference(model: any, prompt: any) {
	// Implement actual Hugging Face inference here
	return { text: `Hugging Face response for model ${model} and prompt: ${prompt}` };
}
