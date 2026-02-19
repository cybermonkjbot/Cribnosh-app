// Requires: bun add openai

export async function queryAzureOpenAI(
    systemPrompt: string,
    userInput: string
): Promise<string> {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';

    if (!apiKey || !endpoint || !deploymentName) {
        return JSON.stringify({
            response_type: 'fallback',
            message: 'Azure OpenAI not configured (missing key, endpoint, or deployment name)'
        });
    }

    try {
        // Azure OpenAI uses the same SDK but requires different initialization
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
            defaultQuery: { 'api-version': apiVersion },
            defaultHeaders: { 'api-key': apiKey },
        });

        const response = await openai.chat.completions.create({
            model: deploymentName, // For Azure, the model is often the deployment name
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userInput }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = response.choices?.[0]?.message?.content || '';
        return reply;
    } catch (err: any) {
        return JSON.stringify({
            response_type: 'fallback',
            message: 'Azure OpenAI error: ' + (err?.message || 'Unknown error')
        });
    }
} 
