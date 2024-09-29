// List of valid keys to include in the payload (the required and optional parameters)
const GENERATE_VALID_KEYS = [
    "model",
    "prompt",
    "suffix",
    "images",
    "format",
    "options",
    "system",
    "template",
    "context",
    "stream",
    "raw",
    "keep_alive"
];

const CHAT_VALID_KEYS = [
    "model",
    "messages",
    "tools",
    "format",
    "options",
    "stream",
    "keep_alive"
];

// Message object fields
const MESSAGE_FIELDS = ["role", "content", "images", "tool_calls"];

module.exports = {
    GENERATE_VALID_KEYS: GENERATE_VALID_KEYS,
    CHAT_VALID_KEYS: CHAT_VALID_KEYS,
    MESSAGE_FIELDS: MESSAGE_FIELDS
}