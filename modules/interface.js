import { fetch } from 'bun';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export async function streamingOllamaInference(model, prompt, callback) {
    try {
        // Get the Ollama IP from the environment variable
        const OLLAMA_IP = process.env.OLLAMA_IP || 'localhost:11434';

        // Prepare the request payload
        const payload = {
            model: model,
            prompt: prompt
        };

        // Send the POST request to Ollama's API
        const response = await fetch(`http://${OLLAMA_IP}/api/generate`, {
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
                        await callback({ text: jsonChunk.response });
                    }
                    if (jsonChunk.done) {
                        return; // End of stream
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk:', e);
                }
            }
        }

        // const result = await response.text();
        // return result;
        
    }
    catch (error) {
        console.error(`Error during Ollama inference: ${error.message}`);
        throw error;
    }
}

export async function ollamaInference(model, prompt, callback) {
    try {
        // Get the Ollama IP from the environment variable
        const OLLAMA_IP = process.env.OLLAMA_IP || 'localhost:11434';

        // Prepare the request payload
        const payload = {
            model: model,
            prompt: prompt,
            stream: false
        };

        // Send the POST request to Ollama's API
        const response = await fetch(`http://${OLLAMA_IP}/api/generate`, {
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

        const result = await response.text();
        return callback(result);
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