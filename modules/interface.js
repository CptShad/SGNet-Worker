import { fetch } from 'bun';
import dotenv from 'dotenv';
const { logger } = require("../utils/logger.js");
import { sanitizeOllamaPayload } from '../utils/utils.js';

dotenv.config({ path: `${__dirname}/.env` });

/**
 * Interacts with ollamas API based on params.
 * - Sanitize payload
 * - Make request to ollamas API (generate/chat)
 * - Return result to callback.
 * @param {*} params 
 * @param {*} callback 
 * @returns 
 */
export async function ollamaInference(params, callback) {
    try {
        // Get the Ollama IP from the environment variable
        const OLLAMA_IP = process.env.OLLAMA_IP || 'localhost:11434';
        const { taskId, stream, type } = params;

        // Prepare the request payload
        const payload = sanitizeOllamaPayload(params);

        // Send the POST request to Ollama's API
        const url = `http://${OLLAMA_IP}/${type === "generate" ? "api/generate" : "api/chat"}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Check if the response is ok (status 200-299)
        if (!response.ok) {
            try {
                const result = await response.json();
                if (result?.error) {
                    logger.error(`Ollama interface error for taskId ${taskId}: ${result.error}`);
                }
            }
            catch (err) {
                logger.error(`Error parsing Ollama response json for taskId ${taskId}: ${err?.message}`);
            }
            throw new Error(`Ollama inference failed for taskId ${taskId} with status ${response.status}: ${response.statusText}`);
        }

        if (stream) {
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
                        if (jsonChunk.response) {
                            // for generate api. This will be send back to the response stream
                            await callback(jsonChunk.response);
                        }
                        if (jsonChunk.message) {
                            // for chat api
                            await callback(jsonChunk.message)
                        }
                        if (jsonChunk.done) {
                            logger.log(`Successfully finished chunk processing for taskId ${taskId}`);
                            return; // End of stream
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
    catch (error) {
        logger.error(`Error during Ollama inference: ${error.message}`);
        throw error;
    }
}

export async function huggingFaceInference(model, prompt) {
    // Implement actual Hugging Face inference here
    return { text: `Hugging Face response for model ${model} and prompt: ${prompt}` };
}