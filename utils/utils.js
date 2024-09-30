const { logger } = require("./logger.js");
const { GENERATE_VALID_KEYS, CHAT_VALID_KEYS, MESSAGE_FIELDS } = require('../constants/ollama.constants');

/**
 * Creates payload of only allowed keys for Ollama API from params
 * @param {*} params 
 * @returns 
 */
const sanitizeOllamaPayload = (params) => {
    const { model, prompt, messages, stream, type } = params;
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
                if (CHAT_VALID_KEYS.includes(key)) {
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
    return payload;
};

module.exports = {
    sanitizeOllamaPayload: sanitizeOllamaPayload
};