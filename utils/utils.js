const parseResponse = (llmResponse) => {
    let fullResponse = '';
    const lines = llmResponse.split('\n').filter(line => line.trim() !== '');
     // Process each line (which is a JSON object)
     for (const line of lines) {
        try {
            const jsonObject = JSON.parse(line);

            // Append the response part to the fullResponse string
            fullResponse += jsonObject.response;

            // Stop if the 'done' flag is true
            if (jsonObject.done) {
                done = true;
                break;
            }
        } catch (error) {
            console.error('Error parsing JSON from stream:', error);
        }
    }
    return fullResponse;
};

module.exports = {
    parseResponse: parseResponse
};