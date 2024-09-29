import { fetch } from 'bun';
import dotenv from 'dotenv';
import { GENERATE_VALID_KEYS, CHAT_VALID_KEYS, MESSAGE_FIELDS } from '../constants/ollama.constants';

dotenv.config({ path: `${__dirname}/.env` });

export async function ollamaInference(params, callback) {
    try {
        // Get the Ollama IP from the environment variable
        const OLLAMA_IP = process.env.OLLAMA_IP || 'localhost:11434';
        const { model, prompt, messages, stream, type } = params;

        // Prepare the request payload
        let payload;

        switch (type) { 
            case "generate":
                payload = {
                    model: model,
                    prompt: prompt,
                    stream: stream || false,
                };
                // Loop through params and add to payload if they are in GENERATE_VALID_KEYS
                for (const key of Object.keys(params)) {
                    if (GENERATE_VALID_KEYS.includes(key)) {
                        payload[key] = params[key];
                    }
                }
                break;

            case "chat":
                payload = {
                    model: model,
                    messages: messages.filter(message => {
                        // Ensure only valid message fields are included
                        return Object.keys(message).every(key => MESSAGE_FIELDS.includes(key));
                    }),
                    stream: stream || false,
                };

                // Only add `tools` if stream is set to `false` and `tools` is provided
                if (params?.tools && !stream) {
                    payload.tools = tools;
                }

                // Loop through params and add to payload if they are in CHAT_VALID_KEYS
                for (const key of Object.keys(params)) {
                    if (GENERATE_VALID_KEYS.includes(key)) {
                        payload[key] = optionalParams[key];
                    }
                }
                break;

            default:
                payload = {
                    model: model,
                    prompt: prompt,
                    stream: stream || false
                };
                // Loop through optionalParams and add to payload if they are in GENERATE_VALID_KEYS
                for (const key of Object.keys(params)) {
                    if (GENERATE_VALID_KEYS.includes(key)) {
                        payload[key] = params[key];
                    } 
                }
        }

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
            throw new Error(`Ollama inference failed with status ${response.status}: ${response.statusText}`);
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
                            await callback({ text: jsonChunk.response });
                        }
                        if (jsonChunk.message) {
                            // for chat api
                            await callback({ message: jsonChunk.message })
                        }
                        if (jsonChunk.done) {
                            console.log(`Successfully finished chunk processing for taskId ${params?.taskId}`);
                            return; // End of stream
                        }
                    }
                    catch (e) {
                        console.error(`Error parsing JSON chunk for taskId ${taskId}: ${e}`);
                    }
                }
            }
        }
        else {
            const result = await response.text();
            console.log(`Successfully fetched ollama result for taskId ${params?.taskId}`);
            return callback(result);
        }

    }
    catch (error) {
        console.error(`Error during Ollama inference: ${error.message}`);
        throw error;
    }
}

export async function huggingFaceInference(model, prompt) {
    // Implement actual Hugging Face inference here
    return { text: `Hugging Face response for model ${model} and prompt: ${prompt}` };
}