import { GENERATE_VALID_KEYS, CHAT_VALID_KEYS, MESSAGE_FIELDS } from '../constants/ollama.constants.js';
import type { GenerateRedisTaskData, ChatRedisTaskData } from '../types/types.d.ts';

/**
 * Creates payload of only allowed keys for Ollama API from params
 * @param {*} params 
 * @returns 
 */
function sanitizeOllamaPayload(params: GenerateRedisTaskData | ChatRedisTaskData): void {
	const { type } = params;
	let payload: any;
	switch (type) {
		case 'generate': {
			const generateParams = params as GenerateRedisTaskData;
			payload = {
				model: generateParams.model,
				prompt: generateParams.prompt,
				stream: generateParams.stream || false,
			};
			// Loop through params and add to payload if they are in GENERATE_VALID_KEYS
			for (const key of Object.keys(generateParams)) {
				if (GENERATE_VALID_KEYS.includes(key)) {
					payload[key] = generateParams[key as keyof GenerateRedisTaskData];
				}
			}
			break;
		}

		case 'chat': {
			const chatParams = params as ChatRedisTaskData;
			payload = {
				model: chatParams.model,
				messages: chatParams.messages?.filter(message => {
					// Ensure only valid message fields are included
					return Object.keys(message).every(key => MESSAGE_FIELDS.includes(key));
				}),
				stream: chatParams.stream || false,
			};

			// Only add `tools` if stream is set to `false` and `tools` is provided
			if (chatParams?.tools && !chatParams.stream) {
				payload.tools = chatParams.tools;
			}

			// Loop through params and add to payload if they are in CHAT_VALID_KEYS
			for (const key of Object.keys(params)) {
				if (CHAT_VALID_KEYS.includes(key)) {
					payload[key] = chatParams[key as keyof ChatRedisTaskData];
				}
			}
			break;
		}
	}
	return payload;
};

export {
	sanitizeOllamaPayload,
};
